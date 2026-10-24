import Link from "next/link";
import { setQty } from "@/app/actions";
import { readCart } from "@/lib/cart";
import { tl } from "@/lib/catalog-data";
import { CartSummary } from "@/components/cart-summary";

export const metadata = { title: "Sepetim" };

export default async function Page() {
  const cart = await readCart();
  if (!cart.lines.length)
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16 text-center">
        <h1 className="text-[22px] font-semibold">Sepetiniz boş</h1>
        <p className="text-muted mt-1">Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayın.</p>
        <Link href="/" className="inline-block mt-5 px-6 h-11 leading-[44px] rounded-lg bg-brand text-white font-semibold">Alışverişe başla</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6">
      <h1 className="text-[22px] font-semibold">Sepetim <span className="text-muted font-normal text-[15px]">({cart.count} ürün)</span></h1>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="grid gap-3 content-start">
          {cart.lines.map((l) => (
            <li key={l.variantId} className="bg-white rounded-xl border border-line p-3 sm:p-4 grid grid-cols-[84px_minmax(0,1fr)] sm:grid-cols-[96px_minmax(0,1fr)_auto] gap-4 items-center">
              <Link href={`/urun/${l.slug}`} className="aspect-[3/4] rounded-md overflow-hidden bg-page">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.image} alt="" className="size-full object-cover" />
              </Link>
              <div className="min-w-0">
                <Link href={`/urun/${l.slug}`} className="text-[14px] leading-snug hover:text-brand"><b className="font-semibold">Kumash</b> {l.title}</Link>
                <div className="text-[12.5px] text-muted mt-1">{l.color} · Beden {l.size}</div>
                {l.stock <= 3 && <div className="text-[12px] text-warn font-semibold mt-1">Son {l.stock} ürün</div>}
                <div className="mt-2 sm:hidden font-semibold text-brand tabular-nums">{tl(l.price * l.qty)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 flex sm:flex-col items-center sm:items-end justify-between gap-3">
                <div className="flex items-center rounded-lg border border-line">
                  <form action={setQty}>
                    <input type="hidden" name="variantId" value={l.variantId} />
                    <input type="hidden" name="qty" value={l.qty - 1} />
                    <button className="size-9 text-[18px]" aria-label="Azalt">−</button>
                  </form>
                  <span className="w-8 text-center tabular-nums text-[14px]" aria-label="Adet">{l.qty}</span>
                  <form action={setQty}>
                    <input type="hidden" name="variantId" value={l.variantId} />
                    <input type="hidden" name="qty" value={Math.min(l.qty + 1, l.stock)} />
                    <button className="size-9 text-[18px] disabled:opacity-30" aria-label="Artır" disabled={l.qty >= l.stock}>+</button>
                  </form>
                </div>
                <div className="hidden sm:block font-semibold text-brand tabular-nums">{tl(l.price * l.qty)}</div>
                <form action={setQty}>
                  <input type="hidden" name="variantId" value={l.variantId} />
                  <input type="hidden" name="qty" value={0} />
                  <button className="text-[12.5px] text-muted hover:text-brand underline underline-offset-2">Sil</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <CartSummary
          cart={cart}
          cta={<Link href="/odeme" className="h-12 rounded-lg bg-brand text-white font-semibold grid place-items-center hover:bg-brand-dark">Sepeti onayla</Link>}
        />
      </div>
    </div>
  );
}
