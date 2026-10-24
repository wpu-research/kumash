import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { assets, categories, products, variants } from "@/db/schema";
import { PageTitle } from "@/components/admin-ui";
import { approveProduct, rejectProduct } from "../../actions";

export const metadata = { title: "Onay bekleyenler" };

const KIND_LABEL: Record<string, string> = { manken: "AI manken", kesik: "Düz çekim", ham: "Çekim fotoğrafı" };

export default async function Page() {
  const d = await db();
  const rows = await d
    .select({ p: products, c: categories })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.status, "onayda"))
    .orderBy(asc(products.id));
  const ids = rows.map((r) => r.p.id);
  const [imgs, vs] = ids.length
    ? await Promise.all([
        d.select().from(assets).where(inArray(assets.productId, ids)).orderBy(asc(assets.sort)),
        d.select().from(variants).where(inArray(variants.productId, ids)).orderBy(asc(variants.id)),
      ])
    : [[], []];

  return (
    <>
      <PageTitle title="Onay bekleyenler" sub="Görselleri kontrol edin, başlık, fiyat ve stoğu düzeltin; onaylanan ürün tüm kanallara gönderilir." />
      {rows.length === 0 && (
        <div className="bg-white rounded-xl border border-line p-10 text-center">
          <p className="font-semibold">Onay bekleyen ürün yok.</p>
          <Link href="/panel/cekim" className="inline-block mt-4 px-5 h-10 leading-10 rounded-lg bg-brand text-white font-semibold">Yeni çekim yükle</Link>
        </div>
      )}
      <div className="grid gap-5">
        {rows.map(({ p, c }) => {
          const mine = imgs.filter((a) => a.productId === p.id);
          const minQc = Math.min(...mine.filter((a) => a.qcScore != null).map((a) => a.qcScore!));
          return (
            <article key={p.id} className="bg-white rounded-xl border border-line p-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
                {mine.map((a) => (
                  <figure key={a.id} className="m-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={KIND_LABEL[a.kind] ?? a.kind} className="aspect-[3/4] w-full object-cover rounded-lg border border-line bg-page" />
                    <figcaption className="mt-1 text-[11.5px] text-muted flex justify-between gap-1">
                      <span>{KIND_LABEL[a.kind] ?? a.kind}</span>
                      {a.qcScore != null && <span className={a.qcScore < 85 ? "text-brand font-semibold" : ""}>QC {a.qcScore}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <form action={approveProduct} className="grid gap-4 content-start">
                <input type="hidden" name="productId" value={p.id} />
                <div className="flex flex-wrap gap-2 text-[12px]">
                  <span className="rounded-full bg-page px-2 py-0.5">{c.gender === "kadin" ? "Kadın" : "Erkek"} · {c.name}</span>
                  <span className="rounded-full bg-page px-2 py-0.5">{p.color} · {p.fabric} · {p.fit}</span>
                  {Number.isFinite(minQc) && <span className={`rounded-full px-2 py-0.5 ${minQc < 85 ? "bg-brand-soft text-brand" : "bg-ok/12 text-ok"}`}>En düşük QC {minQc}</span>}
                </div>
                <label htmlFor={`title-${p.id}`} className="grid gap-1.5 text-[13px] font-medium">
                  Başlık
                  <input id={`title-${p.id}`} name="title" defaultValue={p.title} className="h-10 rounded-lg border border-line px-3 text-[14px] font-normal outline-none focus:border-brand" />
                </label>
                <p className="text-[13px] text-ink/75 leading-relaxed">{p.description}</p>
                <div className="grid gap-4">
                  <label htmlFor={`price-${p.id}`} className="grid gap-1.5 text-[13px] font-medium w-40">
                    Fiyat (TL)
                    <input id={`price-${p.id}`} name="price" inputMode="decimal" defaultValue={(p.price / 100).toFixed(2)} className="h-10 rounded-lg border border-line px-3 text-[14px] font-normal tabular-nums outline-none focus:border-brand" />
                  </label>
                  <fieldset className="grid gap-1.5">
                    <legend className="text-[13px] font-medium mb-1.5">Stok (beden başına)</legend>
                    <div className="flex flex-wrap gap-2">
                      {vs.filter((v) => v.productId === p.id).map((v) => (
                        <label key={v.id} htmlFor={`stock-${v.id}`} className="grid gap-1 text-center text-[11.5px] text-muted">
                          {v.size}
                          <input id={`stock-${v.id}`} name={`stock_${v.id}`} type="number" min={0} defaultValue={v.stock || 10} className="w-14 h-9 rounded-lg border border-line text-center text-[13px] text-ink tabular-nums" />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 h-11 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark">Onayla ve yayınla</button>
                  <button formAction={rejectProduct} className="h-11 px-4 rounded-lg border border-line font-semibold text-muted hover:text-brand hover:border-brand">Reddet</button>
                </div>
                <p className="text-[12px] text-muted -mt-2">Onay sonrası: kendi site hemen, Trendyol ve Instagram kimlik girildiğinde.</p>
              </form>
            </article>
          );
        })}
      </div>
    </>
  );
}
