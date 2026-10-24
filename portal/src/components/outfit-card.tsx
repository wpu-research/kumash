import Link from "next/link";
import type { getOutfits } from "@/lib/catalog";
import { tl } from "@/lib/catalog-data";

export function OutfitCard({ o }: { o: Awaited<ReturnType<typeof getOutfits>>[number] }) {
  const total = o.items.reduce((s, p) => s + p.price, 0);
  return (
    <article className="bg-white rounded-xl border border-line overflow-hidden">
      <div className="grid grid-cols-[1.4fr_1fr] gap-0.5 bg-line aspect-[4/3]">
        <Link href={`/urun/${o.items[0].slug}`} className="bg-page overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.items[0].image} alt={o.items[0].title} className="size-full object-cover" />
        </Link>
        <div className="grid gap-0.5">
          {o.items.slice(1, 3).map((p) => (
            <Link key={p.id} href={`/urun/${p.slug}`} className="bg-page overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image2 ?? p.image} alt={p.title} className="size-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <b className="font-semibold block truncate">{o.name}</b>
          <span className="text-[12.5px] text-muted">{o.items.length} parça · toplam {tl(total)}</span>
        </div>
        <Link href={`/urun/${o.items[0].slug}`} className="shrink-0 rounded-lg border border-brand text-brand px-3 py-2 text-[13px] font-semibold hover:bg-brand-soft">İncele</Link>
      </div>
    </article>
  );
}
