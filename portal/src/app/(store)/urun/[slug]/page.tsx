import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProductsByIds, listProducts } from "@/lib/catalog";
import { FREE_SHIPPING_FROM, PATTERN_NAME, tl } from "@/lib/catalog-data";
import type { Pattern } from "@/lib/garments";
import { BuyBox } from "@/components/buy-box";
import { FavButton } from "@/components/fav-button";
import { Gallery, type GalleryImage } from "@/components/gallery";
import { ReturnIcon, SparkIcon, TruckIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { isStockModel, parseStockModel } from "@/lib/stock";

const G = { kadin: "Kadın", erkek: "Erkek" } as const;
const LABEL: Record<string, string> = { manken: "AI manken", kesik: "Düz çekim", ham: "Çekim fotoğrafı", kombin: "Kombin", sosyal: "Sosyal" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const r = await getProduct((await params).slug);
  return { title: r ? `${r.product.color} ${r.product.title}` : "Ürün" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const r = await getProduct((await params).slug);
  if (!r) notFound();
  const { product: p, category: c, variants, assets, outfits } = r;
  const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  const images: GalleryImage[] = assets.map((a, i) =>
    isStockModel(a.model)
      ? { url: a.url, label: a.url.includes("-detay") ? "Kumaş detayı" : "Fotoğraf", ai: false }
      : {
          url: a.url,
          label: a.kind === "manken" ? `${LABEL.manken} · ${i === 0 ? "ön" : "arka"}` : LABEL[a.kind],
          ai: a.kind === "manken" || a.kind === "kombin",
        },
  );
  const credit = assets.find((a) => isStockModel(a.model));
  const hasAi = images.some((i) => i.ai);
  const outfitIds = [...new Set(outfits.flatMap((o) => o.productIds))].filter((id) => id !== p.id);
  const [outfitItems, similar] = await Promise.all([
    getProductsByIds(outfitIds),
    listProducts({ categorySlug: c.slug, perPage: 9 }),
  ]);
  const attrs: [string, string][] = [
    ["Renk", p.color],
    ["Kumaş", p.fabric],
    ["Kalıp", p.fit],
    ["Desen", PATTERN_NAME[p.pattern as Pattern] ?? p.pattern],
    ...Object.entries(p.attrs).filter(([k]) => !["Kumaş", "Desen", "Kalıp"].includes(k)),
    ["Ürün kodu", `KMS-${String(p.id).padStart(5, "0")}`],
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6">
      <nav className="text-[12px] text-muted flex flex-wrap gap-1.5" aria-label="Konum">
        <Link href="/" className="hover:text-brand">Kumash</Link><span>/</span>
        <Link href={`/${c.gender}`} className="hover:text-brand">{G[c.gender]}</Link><span>/</span>
        <Link href={`/kategori/${c.slug}`} className="hover:text-brand">{c.name}</Link><span>/</span>
        <span className="text-ink">{p.title}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Gallery images={images} alt={`${p.color} ${p.title}`} />
          {credit?.model && <PhotoCredit model={credit.model} />}
        </div>

        <div className="min-w-0">
          <h1 className="text-[22px] leading-snug">
            <b className="font-semibold">Kumash</b> <span>{p.title}</span>
          </h1>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
            <span className="size-3 rounded-full border border-black/15" style={{ background: p.colorHex }} />
            {p.color} · {G[c.gender]} {c.name}
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-[28px] font-semibold text-brand tabular-nums leading-none">{tl(p.price)}</span>
            {p.comparePrice && (
              <>
                <s className="text-[15px] text-muted tabular-nums">{tl(p.comparePrice)}</s>
                <span className="rounded bg-brand text-white text-[12px] font-semibold px-1.5 py-0.5">%{discount}</span>
              </>
            )}
          </div>

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
            <BuyBox variants={variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock }))} />
            <FavButton id={p.id} large />
          </div>

          <ul className="mt-6 grid gap-2 text-[14px]">
            <li className="flex items-center gap-2.5">
              <TruckIcon className="size-5 text-ok" />
              {p.price >= FREE_SHIPPING_FROM ? <span><b className="text-ok">Kargo bedava.</b> 14:00'e kadar verilen siparişler aynı gün kargoda.</span> : <span>500 TL üzeri siparişlerde kargo bedava. 14:00'e kadar aynı gün kargo.</span>}
            </li>
            <li className="flex items-center gap-2.5"><ReturnIcon className="size-5 text-ink/70" /> 14 gün içinde ücretsiz iade ve değişim.</li>
          </ul>

          <div className="mt-6 rounded-lg border border-line bg-white">
            <h2 className="px-4 py-3 font-semibold text-[15px] border-b border-line">Ürün özellikleri</h2>
            <dl className="grid grid-cols-2 text-[13.5px]">
              {attrs.map(([k, v]) => (
                <div key={k} className="px-4 py-2.5 border-b border-line odd:border-r flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="px-4 py-4 text-[14px] leading-relaxed text-ink/85">{p.description}</div>
          </div>

          {hasAi && (
            <p className="mt-4 flex gap-2 text-[12.5px] text-muted leading-relaxed">
              <SparkIcon className="size-4 shrink-0 mt-0.5" />
              Manken görselleri yapay zekâ ile oluşturulmuştur ve bedeni temsil etmez. Renk ve dokuyu düz çekim fotoğraftan kontrol edebilirsiniz.
            </p>
          )}
        </div>
      </div>

      {outfitItems.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[20px] font-semibold">Kombini tamamla</h2>
          <p className="text-[13px] text-muted">Bu ürünle birlikte önerdiğimiz parçalar</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {outfitItems.slice(0, 5).map((x) => <ProductCard key={x.id} p={x} />)}
          </div>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-[20px] font-semibold">Benzer ürünler</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {similar.items.filter((x) => x.id !== p.id).slice(0, 8).map((x) => <ProductCard key={x.id} p={x} />)}
        </div>
      </section>
    </div>
  );
}

function PhotoCredit({ model }: { model: string }) {
  const c = parseStockModel(model);
  return (
    <p className="mt-2 text-[11.5px] text-muted pl-[76px] sm:pl-[88px]">
      Fotoğraf:{" "}
      {c.source ? <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{c.creator}</a> : c.creator}
      {" · "}
      {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{c.license}</a> : c.license}
      {" · Openverse demo görseli"}
    </p>
  );
}
