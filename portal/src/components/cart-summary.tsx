import type { readCart } from "@/lib/cart";
import { FREE_SHIPPING_FROM, tl } from "@/lib/catalog-data";

export function CartSummary({ cart, cta }: { cart: Awaited<ReturnType<typeof readCart>>; cta?: React.ReactNode }) {
  const left = FREE_SHIPPING_FROM - cart.subtotal;
  const pct = Math.min(100, (cart.subtotal / FREE_SHIPPING_FROM) * 100);
  return (
    <aside className="bg-white rounded-xl border border-line p-5 h-max lg:sticky lg:top-[150px] grid gap-4">
      <h2 className="font-semibold text-[17px]">Sipariş özeti</h2>
      <div>
        <div className="text-[13px] mb-2">
          {left > 0 ? <>Kargo bedava için <b className="text-brand">{tl(left)}</b> daha ekleyin.</> : <b className="text-ok">Kargonuz bedava.</b>}
        </div>
        {/* mezura: 0 — 500 TL */}
        <div className="relative h-7 rounded bg-page overflow-hidden border border-line" role="progressbar" aria-valuemin={0} aria-valuemax={500} aria-valuenow={Math.round(cart.subtotal / 100)} aria-label="Kargo bedava eşiği">
          <div className="tape absolute inset-y-0 left-0" style={{ width: `${pct}%` }} />
          <div className="absolute inset-x-2 bottom-0.5 flex justify-between text-[9px] font-mono text-ink/60">
            <span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500 TL</span>
          </div>
        </div>
      </div>
      <dl className="grid gap-2 text-[14px]">
        <div className="flex justify-between"><dt className="text-muted">Ürünler ({cart.count})</dt><dd className="tabular-nums">{tl(cart.subtotal)}</dd></div>
        {cart.savings > 0 && <div className="flex justify-between text-ok"><dt>İndirim kazancınız</dt><dd className="tabular-nums">−{tl(cart.savings)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Kargo</dt><dd className="tabular-nums">{cart.shipping ? tl(cart.shipping) : "Bedava"}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-[16px] font-semibold"><dt>Toplam</dt><dd className="tabular-nums text-brand">{tl(cart.total)}</dd></div>
      </dl>
      {cta}
    </aside>
  );
}
