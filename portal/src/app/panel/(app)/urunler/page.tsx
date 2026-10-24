import Link from "next/link";
import { and, asc, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { assets, categories, channelListings, products } from "@/db/schema";
import { tl } from "@/lib/catalog-data";
import { CHANNEL_LABEL, Chip, LISTING_LABEL, LISTING_STYLE, PRODUCT_STATUS, PageTitle } from "@/components/admin-ui";
import { setProductStatus } from "../../actions";

export const metadata = { title: "Ürünler" };

const TABS = [
  { k: "", label: "Tümü" },
  { k: "yayinda", label: "Yayında" },
  { k: "onayda", label: "Onayda" },
  { k: "arsiv", label: "Arşiv" },
] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ durum?: string; q?: string; sayfa?: string }> }) {
  const sp = await searchParams;
  const d = await db();
  const where: SQL[] = [];
  const durum = TABS.find((t) => t.k === sp.durum)?.k ?? "";
  if (durum) where.push(eq(products.status, durum as "yayinda"));
  if (sp.q) where.push(ilike(products.title, `%${sp.q}%`));
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const per = 30;
  const stock = sql<number>`coalesce((select sum(stock) from variants v where v.product_id = ${products.id}), 0)`.mapWith(Number);
  const [rows, [{ n }]] = await Promise.all([
    d
      .select({ p: products, c: categories, stock })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(products.id))
      .limit(per)
      .offset((page - 1) * per),
    d.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(products).where(where.length ? and(...where) : undefined),
  ]);
  const ids = rows.map((r) => r.p.id);
  const [imgs, lst] = ids.length
    ? await Promise.all([
        d.select().from(assets).where(and(inArray(assets.productId, ids), eq(assets.kind, "manken"))).orderBy(asc(assets.sort)),
        d.select().from(channelListings).where(inArray(channelListings.productId, ids)),
      ])
    : [[], []];
  const pages = Math.max(1, Math.ceil(n / per));
  const qs = (extra: Record<string, string | number>) => {
    const q = new URLSearchParams();
    if (durum) q.set("durum", durum);
    if (sp.q) q.set("q", sp.q);
    for (const [k, v] of Object.entries(extra)) q.set(k, String(v));
    return `/panel/urunler?${q}`;
  };

  return (
    <>
      <PageTitle title="Ürünler" sub={`${n} ürün`} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <nav className="flex gap-1 bg-white rounded-lg border border-line p-1 text-[13.5px]">
          {TABS.map((t) => (
            <Link key={t.k} href={t.k ? `/panel/urunler?durum=${t.k}` : "/panel/urunler"} className={`px-3 py-1.5 rounded-md ${durum === t.k ? "bg-ink text-white font-semibold" : "hover:bg-page"}`}>{t.label}</Link>
          ))}
        </nav>
        <form className="flex gap-2">
          {durum && <input type="hidden" name="durum" value={durum} />}
          <input id="urun-ara" name="q" defaultValue={sp.q} placeholder="Başlıkta ara" className="h-10 w-56 rounded-lg border border-line bg-white px-3 text-[14px]" />
          <button className="h-10 px-4 rounded-lg bg-ink text-white text-[13.5px] font-semibold">Ara</button>
        </form>
      </div>
      <div className="bg-white rounded-xl border border-line overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13.5px]">
          <thead>
            <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted border-b border-line">
              <th className="p-3 font-semibold">Ürün</th>
              <th className="p-3 font-semibold">Kategori</th>
              <th className="p-3 font-semibold text-right">Fiyat</th>
              <th className="p-3 font-semibold text-right">Stok</th>
              <th className="p-3 font-semibold">Durum</th>
              <th className="p-3 font-semibold">Kanallar</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, c, stock }) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-page/60">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgs.find((a) => a.productId === p.id)?.url} alt="" className="w-10 aspect-[3/4] rounded object-cover bg-page" />
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[280px]">{p.title}</div>
                      <div className="text-[12px] text-muted">KMS-{String(p.id).padStart(5, "0")} · {p.color}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted">{c.gender === "kadin" ? "Kadın" : "Erkek"} / {c.name}</td>
                <td className="p-3 text-right tabular-nums">{tl(p.price)}</td>
                <td className={`p-3 text-right tabular-nums ${stock === 0 ? "text-brand font-semibold" : ""}`}>{stock}</td>
                <td className="p-3"><Chip className={PRODUCT_STATUS[p.status][1]}>{PRODUCT_STATUS[p.status][0]}</Chip></td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {lst.filter((l) => l.productId === p.id).sort((a, b) => a.channel.localeCompare(b.channel)).map((l) => (
                      <Chip key={l.channel} className={LISTING_STYLE[l.status]} title={l.lastError ?? LISTING_LABEL[l.status]}>{CHANNEL_LABEL[l.channel]}</Chip>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {p.status === "yayinda" && <Link href={`/urun/${p.slug}`} className="text-[12.5px] text-brand font-semibold mr-3">Gör</Link>}
                  {(p.status === "yayinda" || p.status === "arsiv") && (
                    <form action={setProductStatus} className="inline">
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="status" value={p.status === "yayinda" ? "arsiv" : "yayinda"} />
                      <button className="text-[12.5px] text-muted hover:text-brand underline underline-offset-2">{p.status === "yayinda" ? "Yayından kaldır" : "Yeniden yayınla"}</button>
                    </form>
                  )}
                  {p.status === "onayda" && <Link href="/panel/onay" className="text-[12.5px] text-brand font-semibold">Onayla</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="mt-5 flex flex-wrap gap-1.5" aria-label="Sayfalar">
          {Array.from({ length: pages }, (_, i) => i + 1).map((k) => (
            <Link key={k} href={qs({ sayfa: k })} aria-current={k === page ? "page" : undefined} className={`size-9 grid place-items-center rounded-lg border text-[13px] ${k === page ? "bg-ink border-ink text-white" : "bg-white border-line"}`}>{k}</Link>
          ))}
        </nav>
      )}
    </>
  );
}
