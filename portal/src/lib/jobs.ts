import { and, asc, eq, sql } from "drizzle-orm";
import { db, type DB } from "@/db";
import { jobs, products, shoots } from "@/db/schema";
import { BASE_PRICE, rng } from "./catalog-data";
import path from "node:path";
import { getProvider } from "./pipeline";
import { mockProvider } from "./pipeline/mock";
import { renderItemImages } from "./pipeline/images";
import { PermanentError } from "./pipeline/provider";
import { createProduct } from "./products";
import { publishEverywhere } from "./publishers";

// Postgres tablosu üstünde basit iş kuyruğu. Aynı süreçte çalışır; hacim artınca
// Redis + BullMQ'ya taşınacak (plan: ayrı worker servisi). Arayüz aynı kalır: enqueue + işleyiciler.

export type JobType = "process_shoot" | "publish_product" | "sync_stock";
const MAX_ATTEMPTS = 3;
const MOCK_STEP_MS = Number(process.env.MOCK_STEP_MS ?? 700);

const g = globalThis as unknown as { __kumashWorker?: boolean };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function enqueue(type: JobType, payload: Record<string, unknown>) {
  const d = await db();
  const [job] = await d.insert(jobs).values({ type, payload }).returning();
  kick();
  return job;
}

export function kick() {
  if (g.__kumashWorker) return;
  g.__kumashWorker = true;
  void (async () => {
    try {
      const d = await db();
      for (;;) {
        const [job] = await d.select().from(jobs).where(eq(jobs.status, "bekliyor")).orderBy(asc(jobs.id)).limit(1);
        if (!job) break;
        await d.update(jobs).set({ status: "calisiyor", attempts: job.attempts + 1, updatedAt: new Date() }).where(eq(jobs.id, job.id));
        const log = async (msg: string) => {
          await d
            .update(jobs)
            .set({ log: sql`${jobs.log} || ${JSON.stringify([{ at: new Date().toISOString(), msg }])}::jsonb`, updatedAt: new Date() })
            .where(eq(jobs.id, job.id));
        };
        try {
          await handlers[job.type as JobType](d, job.payload, log, job.id);
          await d.update(jobs).set({ status: "tamamlandi", error: null, updatedAt: new Date() }).where(eq(jobs.id, job.id));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await log(`hata: ${msg}`);
          const retry = !(err instanceof PermanentError) && job.attempts + 1 < MAX_ATTEMPTS;
          await d.update(jobs).set({ status: retry ? "bekliyor" : "hata", error: msg, updatedAt: new Date() }).where(eq(jobs.id, job.id));
        }
      }
    } finally {
      g.__kumashWorker = false;
    }
  })();
}

type Handler = (d: DB, payload: Record<string, unknown>, log: (m: string) => Promise<void>, jobId: number) => Promise<void>;

const handlers: Record<JobType, Handler> = {
  // Çekim → analiz (parçaları bul, oku, metni yaz) → görseller → ürünler "onayda"
  async process_shoot(d, payload, log, jobId) {
    const shootId = Number(payload.shootId);
    const [shoot] = await d.select().from(shoots).where(eq(shoots.id, shootId));
    if (!shoot) throw new Error(`Çekim bulunamadı: ${shootId}`);
    await d.update(shoots).set({ status: "isleniyor" }).where(eq(shoots.id, shootId));
    const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
    const photos = {
      urls: shoot.photoUrls,
      paths: shoot.photoUrls.map((u) => path.join(root, u.replace(/^\/uploads\//, ""))),
    };
    // Fotoğrafsız deneme çekimi her zaman mock ile işlenir
    const ai = photos.paths.length ? getProvider() : mockProvider;
    await log(`sağlayıcı: ${ai.name}`);

    let analysis;
    try {
      analysis = await ai.analyze(photos, shootId);
    } catch (err) {
      await d.update(shoots).set({ status: "hata" }).where(eq(shoots.id, shootId));
      throw err;
    }
    if (ai === mockProvider) await wait(MOCK_STEP_MS);
    await log(`ayrıştırma: ${analysis.items.length} parça bulundu (${analysis.items.map((i) => i.garment).join(", ") || "yok"})`);
    for (const n of analysis.notes) await log(`not: ${n}`);
    await d.update(jobs).set({ costCents: analysis.costCents }).where(eq(jobs.id, jobId));

    for (const item of analysis.items) {
      await log(`#${item.index + 1} tanıma: ${item.attrs.color}, ${item.attrs.fabric}, ${item.attrs.style} (güven %${Math.round(item.confidence * 100)})`);
      const images = await renderItemImages(item, shootId, photos);
      if (ai === mockProvider) await wait(MOCK_STEP_MS);
      await log(`#${item.index + 1} giydirme: ${images.length} görsel${images.some((i) => i.model === "foto-kesit") ? ", fotoğraftan kesit alındı" : ""}`);
      const r = rng(shootId * 101 + item.index);
      const price = Math.round(BASE_PRICE[item.garment] * (0.85 + r() * 0.5)) * 100 - 1;
      const p = await createProduct(d, {
        gender: item.gender,
        garment: item.garment,
        attrs: item.attrs,
        copy: item.copy,
        images,
        price,
        comparePrice: null,
        status: "onayda",
        shootId,
        rawUrl: shoot.photoUrls[item.photoIndex] ?? null,
        stock: () => 0,
      });
      await log(`#${item.index + 1} metin: "${item.copy.title}" → ürün #${p.id} onayda`);
    }
    await log(`maliyet: ${(analysis.costCents / 100).toFixed(2)} USD (${analysis.model})`);
    await d.update(shoots).set({ status: "tamamlandi" }).where(eq(shoots.id, shootId));
  },

  async publish_product(d, payload, log) {
    const productId = Number(payload.productId);
    await d
      .update(products)
      .set({ status: "yayinda", publishedAt: new Date() })
      .where(and(eq(products.id, productId)));
    await publishEverywhere(d, productId, log);
  },

  // Bir kanalda satış olunca diğer kanallara stok bildirimi. Trendyol bağlanınca stok güncelleme ucu burada çağrılacak.
  async sync_stock(_d, payload, log) {
    const ids = (payload.variantIds as number[]) ?? [];
    await log(`stok değişti: ${ids.length} varyant; kanal bağlantısı yok, yalnız site güncel`);
  },
};
