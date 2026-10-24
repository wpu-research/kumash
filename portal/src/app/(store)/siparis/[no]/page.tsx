import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { tl } from "@/lib/catalog-data";
import { CheckIcon } from "@/components/icons";

export const metadata = { title: "Siparişiniz alındı" };

export default async function Page({ params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const d = await db();
  const [o] = await d.select().from(orders).where(eq(orders.no, no));
  if (!o) notFound();
  const items = await d.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <div className="bg-white rounded-xl border border-line p-6 sm:p-8">
        <span className="size-12 rounded-full bg-ok/10 text-ok grid place-items-center"><CheckIcon className="size-6" /></span>
        <h1 className="text-[24px] font-semibold mt-4">Siparişiniz alındı</h1>
        <p className="text-muted mt-1">Sipariş numaranız <b className="text-ink font-mono">{o.no}</b>. Kargoya verildiğinde {o.email} adresine bilgi göndereceğiz.</p>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {items.map((i) => (
            <li key={i.id} className="py-3 flex justify-between gap-4 text-[14px]">
              <span>{i.title} · {i.size} <span className="text-muted">×{i.qty}</span></span>
              <span className="tabular-nums">{tl(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-1.5 text-[14px]">
          <div className="flex justify-between"><dt className="text-muted">Kargo</dt><dd>{o.shipping ? tl(o.shipping) : "Bedava"}</dd></div>
          <div className="flex justify-between font-semibold text-[16px]"><dt>Toplam</dt><dd className="text-brand">{tl(o.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Ödeme</dt><dd>{o.payment}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Teslimat</dt><dd className="text-right">{o.customerName}, {o.city}</dd></div>
        </dl>
        <Link href="/" className="inline-block mt-6 px-6 h-11 leading-[44px] rounded-lg bg-brand text-white font-semibold">Alışverişe devam et</Link>
      </div>
    </div>
  );
}
