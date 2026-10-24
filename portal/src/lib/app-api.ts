import { createHmac, timingSafeEqual } from "node:crypto";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, type DB } from "@/db";
import { assets, categories, channelListings, products, variants } from "@/db/schema";
import { adminPassword, secret } from "./auth";
import { kick } from "./jobs";

// Atölye mobil uygulaması için Bearer token. Panel çerezinden ayrı: telefonda 30 gün açık kalır.
const TTL = 60 * 60 * 24 * 30;

const sign = (v: string) => createHmac("sha256", secret()).update(`app.${v}`).digest("base64url");

export function issueToken() {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  return { token: `${exp}.${sign(String(exp))}`, expiresAt: new Date(exp * 1000).toISOString() };
}

export function checkPassword(given: string) {
  const expected = adminPassword();
  if (!expected) return false;
  const a = createHmac("sha256", "pw").update(given).digest();
  const b = createHmac("sha256", "pw").update(expected).digest();
  return timingSafeEqual(a, b);
}

function verify(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [exp, sig] = tok.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Ctx<P> = { params: Promise<P> };

// Yetki kontrolü + tek tip hata cevabı. Her istekte kuyruğu da dürter (sunucu yeniden başladıysa yarım iş kalmasın).
export function appRoute<P = Record<string, string>>(fn: (req: Request, params: P) => Promise<Response | object>) {
  return async (req: Request, ctx: Ctx<P>) => {
    if (!verify(req)) return Response.json({ error: "Oturum geçersiz, tekrar giriş yapın." }, { status: 401 });
    kick();
    try {
      const out = await fn(req, await ctx.params);
      return out instanceof Response ? out : Response.json(out);
    } catch (err) {
      if (err instanceof ApiError) return Response.json({ error: err.message }, { status: err.status });
      console.error("[app-api]", err);
      return Response.json({ error: "Sunucu hatası" }, { status: 500 });
    }
  };
}

export function intParam(v: string | undefined) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, "Geçersiz kimlik");
  return n;
}

// Görsel yolları göreli (/uploads/..., /img/g?...); uygulama tam adres ister.
export function origin(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}
export const abs = (base: string, url: string) => (/^https?:\/\//.test(url) ? url : `${base}${url}`);

export async function getOne(req: Request, id: number) {
  const [p] = await loadProducts(await db(), origin(req), { ids: [id] });
  if (!p) throw new ApiError(404, "Ürün bulunamadı");
  return p;
}

export type AppProduct = Awaited<ReturnType<typeof loadProducts>>[number];

export async function loadProducts(d: DB, base: string, where: { ids?: number[]; status?: (typeof products.$inferSelect)["status"]; shootId?: number; limit?: number }) {
  const q = d
    .select({ p: products, c: categories })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .$dynamic();
  if (where.ids) q.where(inArray(products.id, where.ids.length ? where.ids : [-1]));
  else if (where.status) q.where(eq(products.status, where.status));
  else if (where.shootId) q.where(eq(products.shootId, where.shootId));
  const rows = await q.orderBy(where.status === "onayda" || where.shootId ? asc(products.id) : desc(products.id)).limit(where.limit ?? 100);
  const ids = rows.map((r) => r.p.id);
  const [imgs, vs, ls] = ids.length
    ? await Promise.all([
        d.select().from(assets).where(inArray(assets.productId, ids)).orderBy(asc(assets.sort), asc(assets.id)),
        d.select().from(variants).where(inArray(variants.productId, ids)).orderBy(asc(variants.id)),
        d.select().from(channelListings).where(inArray(channelListings.productId, ids)),
      ])
    : [[], [], []];
  return rows.map(({ p, c }) => ({
    id: p.id,
    slug: p.slug,
    code: `KMS-${String(p.id).padStart(5, "0")}`,
    title: p.title,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice,
    status: p.status,
    color: p.color,
    colorHex: p.colorHex,
    fabric: p.fabric,
    fit: p.fit,
    pattern: p.pattern,
    shootId: p.shootId,
    category: { name: c.name, gender: c.gender, garment: c.garment },
    url: `${base}/urun/${p.slug}`,
    images: imgs.filter((a) => a.productId === p.id).map((a) => ({ id: a.id, kind: a.kind, url: abs(base, a.url), qc: a.qcScore })),
    variants: vs.filter((v) => v.productId === p.id).map((v) => ({ id: v.id, size: v.size, stock: v.stock })),
    listings: ls.filter((l) => l.productId === p.id).map((l) => ({ channel: l.channel, status: l.status, error: l.lastError })),
    createdAt: p.createdAt,
    publishedAt: p.publishedAt,
  }));
}
