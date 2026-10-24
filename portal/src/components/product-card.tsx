import Link from "next/link";
import type { CardProduct } from "@/lib/catalog";
import { FREE_SHIPPING_FROM, tl } from "@/lib/catalog-data";
import { FavButton } from "./fav-button";

export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  const isNew = Date.now() - new Date(p.createdAt).getTime() < 1000 * 60 * 60 * 24 * 3 && !discount;
  return (
    <article className="group relative bg-white rounded-lg border border-line overflow-hidden hover:shadow-[0_8px_28px_-12px_rgba(27,26,31,.35)] transition-shadow">
      <Link href={`/urun/${p.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-page overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={`${p.color} ${p.title}`} loading={priority ? "eager" : "lazy"} className="absolute inset-0 size-full object-cover transition-opacity duration-300 group-hover:opacity-0" />
          {p.image2 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image2} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
            {discount > 0 && <span className="rounded bg-brand text-white text-[11px] font-semibold px-1.5 py-0.5">%{discount} indirim</span>}
            {isNew && <span className="rounded bg-ink text-white text-[11px] font-semibold px-1.5 py-0.5">Yeni</span>}
          </div>
          {p.stock === 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-white/85 text-center text-[12px] font-semibold py-1.5">Tükendi</div>
          )}
          {p.stock > 0 && p.stock <= 5 && (
            <div className="absolute inset-x-0 bottom-0 bg-white/85 text-center text-[12px] font-semibold text-warn py-1.5">Son {p.stock} ürün</div>
          )}
        </div>
        <div className="p-3 pb-3.5">
          <h3 className="text-[13.5px] leading-snug line-clamp-2 min-h-[2.6em]">
            <b className="font-semibold">Kumash</b> <span className="text-ink/80">{p.title}</span>
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
            <span className="size-2.5 rounded-full border border-black/10" style={{ background: p.colorHex }} />
            {p.color}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[16px] font-semibold text-brand tabular-nums">{tl(p.price)}</span>
            {p.comparePrice && <s className="text-[12px] text-muted tabular-nums">{tl(p.comparePrice)}</s>}
          </div>
          {p.price >= FREE_SHIPPING_FROM && <div className="mt-1.5 text-[11px] font-semibold text-ok">Kargo Bedava</div>}
        </div>
      </Link>
      <FavButton id={p.id} className="absolute right-2 top-2" />
    </article>
  );
}

export function ProductGrid({ items }: { items: CardProduct[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < 4} />
      ))}
    </div>
  );
}
