import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { appRoute } from "@/lib/app-api";

export const dynamic = "force-dynamic";

export const GET = appRoute(async () => {
  const d = await db();
  const rows = await d.select().from(orders).orderBy(desc(orders.id)).limit(100);
  const items = rows.length ? await d.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((o) => o.id))) : [];
  return {
    orders: rows.map((o) => ({
      id: o.id, no: o.no, channel: o.channel, status: o.status, customerName: o.customerName, phone: o.phone,
      city: o.city, address: o.address, total: o.total, shipping: o.shipping, payment: o.payment, createdAt: o.createdAt,
      items: items.filter((i) => i.orderId === o.id).map((i) => ({ productId: i.productId, title: i.title, size: i.size, qty: i.qty, price: i.price })),
    })),
  };
});
