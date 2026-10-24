import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { assets, jobs, products, shoots } from "@/db/schema";
import { tl } from "@/lib/catalog-data";
import { Chip, JOB_STATUS, PRODUCT_STATUS, PageTitle } from "@/components/admin-ui";
import { AutoRefresh } from "./auto-refresh";

const STEPS = ["Yüklendi", "Ayrıştırma", "Tanıma", "Giydirme", "Metin", "Onaya hazır"];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = await db();
  const [shoot] = await d.select().from(shoots).where(eq(shoots.id, id));
  if (!shoot) notFound();
  const [job] = await d.select().from(jobs).where(and(eq(jobs.type, "process_shoot"), sql`${jobs.payload}->>'shootId' = ${String(id)}`)).limit(1);
  const items = await d.select().from(products).where(eq(products.shootId, id)).orderBy(asc(products.id));
  const imgs = items.length ? await d.select().from(assets).where(and(inArray(assets.productId, items.map((p) => p.id)), eq(assets.kind, "manken"))) : [];
  const log = job?.log ?? [];
  const has = (w: string) => log.some((l) => l.msg.includes(w));
  const reached = shoot.status === "tamamlandi" ? 5 : has("metin") ? 4 : has("giydirme") ? 3 : has("tanıma") ? 2 : has("ayrıştırma") ? 1 : 0;
  const running = shoot.status === "yuklendi" || shoot.status === "isleniyor";

  return (
    <>
      <AutoRefresh active={running} />
      <PageTitle
        title={`Çekim #${shoot.id}`}
        sub={shoot.note ?? "Not yok"}
        action={job && <Chip className={JOB_STATUS[job.status][1]}>{JOB_STATUS[job.status][0]}</Chip>}
      />
      <ol className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-lg px-3 py-2.5 text-[13px] border ${i < reached || (i === reached && !running) ? "bg-ok/10 border-ok/30 text-ok font-semibold" : i === reached ? "bg-tape/25 border-tape text-tape-ink font-semibold animate-pulse" : "bg-white border-line text-muted"}`}>
            <span className="font-mono text-[11px] opacity-70">{String(i + 1).padStart(2, "0")}</span> {s}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="bg-white rounded-xl border border-line p-5">
          <h2 className="font-semibold">Fotoğraflar</h2>
          {shoot.photoUrls.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {shoot.photoUrls.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="Çekim fotoğrafı" className="rounded-lg border border-line aspect-square object-cover" />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13.5px] text-muted">Fotoğrafsız deneme çekimi.</p>
          )}
          <h2 className="font-semibold mt-6">İşlem kaydı</h2>
          <ol className="mt-2 font-mono text-[12px] grid gap-1.5">
            {log.length === 0 && <li className="text-muted">Sırada…</li>}
            {log.map((l, i) => (
              <li key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
                <span className="text-muted">{new Date(l.at).toLocaleTimeString("tr-TR")}</span>
                <span className="break-words">{l.msg}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white rounded-xl border border-line p-5">
          <div className="flex justify-between items-baseline gap-3">
            <h2 className="font-semibold">Çıkan ürünler ({items.length})</h2>
            {items.some((p) => p.status === "onayda") && <Link href="/panel/onay" className="text-[13px] font-semibold text-brand">Onaya git →</Link>}
          </div>
          {items.length === 0 && <p className="mt-3 text-[13.5px] text-muted">{running ? "AI parçaları işliyor…" : "Bu çekimden ürün çıkmadı."}</p>}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((p) => (
              <div key={p.id} className="rounded-lg border border-line overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgs.find((a) => a.productId === p.id)?.url} alt="" className="aspect-[3/4] w-full object-cover bg-page" />
                <div className="p-2.5">
                  <div className="text-[13px] font-medium leading-snug line-clamp-2">{p.title}</div>
                  <div className="text-[12px] text-muted">{p.color} · {tl(p.price)}</div>
                  <div className="mt-1.5"><Chip className={PRODUCT_STATUS[p.status][1]}>{PRODUCT_STATUS[p.status][0]}</Chip></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
