import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { tl } from "@/lib/catalog-data";
import { PageTitle, fmtDate } from "@/components/admin-ui";
import { setOrderStatus } from "../../actions";
import { StatusSelect } from "./status-select";

export const metadata = { title: "Siparişler" };

export default async function Page() {
  const d = await db();
  const list = await d.select().from(orders).orderBy(desc(orders.id)).limit(100);
  const items = list.length ? await d.select().from(orderItems).where(inArray(orderItems.orderId, list.map((o) => o.id))) : [];
  return (
    <>
      <PageTitle title="Siparişler" sub="Tüm kanallardan gelen siparişler tek listede (şu an yalnız kendi site)" />
      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-line p-10 text-center">
          <p className="font-semibold">Henüz sipariş yok.</p>
          <p className="text-muted text-[14px] mt-1">Mağazadan bir test siparişi verdiğinizde burada görünür.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-line overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted border-b border-line">
                <th className="p-3 font-semibold">Sipariş</th>
                <th className="p-3 font-semibold">Müşteri</th>
                <th className="p-3 font-semibold">Ürünler</th>
                <th className="p-3 font-semibold text-right">Tutar</th>
                <th className="p-3 font-semibold">Ödeme</th>
                <th className="p-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0 align-top">
                  <td className="p-3">
                    <div className="font-mono font-semibold">{o.no}</div>
                    <div className="text-[12px] text-muted">{fmtDate(o.createdAt)} · {o.channel === "site" ? "Site" : o.channel}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-[12px] text-muted">{o.city} · {o.phone}</div>
                  </td>
                  <td className="p-3 text-[12.5px]">
                    {items.filter((i) => i.orderId === o.id).map((i) => (
                      <div key={i.id}>{i.title} · {i.size} <span className="text-muted">×{i.qty}</span></div>
                    ))}
                  </td>
                  <td className="p-3 text-right tabular-nums font-semibold">{tl(o.total)}</td>
                  <td className="p-3 text-muted">{o.payment}</td>
                  <td className="p-3">
                    <form action={setOrderStatus}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <StatusSelect id={`status-${o.id}`} value={o.status} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
