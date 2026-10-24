import Link from "next/link";
import { redirect } from "next/navigation";
import { readCart } from "@/lib/cart";
import { CartSummary } from "@/components/cart-summary";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Ödeme" };

export default async function Page() {
  const cart = await readCart();
  if (!cart.lines.length) redirect("/sepet");
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6">
      <nav className="text-[12px] text-muted"><Link href="/sepet" className="hover:text-brand">Sepet</Link> / <span className="text-ink">Teslimat ve ödeme</span></nav>
      <h1 className="text-[22px] font-semibold mt-2">Teslimat ve ödeme</h1>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <CheckoutForm />
        <CartSummary
          cart={cart}
          cta={
            <ul className="grid gap-2 border-t border-line pt-3">
              {cart.lines.map((l) => (
                <li key={l.variantId} className="flex gap-3 items-center text-[13px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt="" className="w-10 aspect-[3/4] rounded object-cover bg-page" />
                  <span className="min-w-0 flex-1 truncate">{l.title} · {l.size}</span>
                  <span className="text-muted">×{l.qty}</span>
                </li>
              ))}
            </ul>
          }
        />
      </div>
    </div>
  );
}
