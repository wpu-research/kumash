"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, variants } from "@/db/schema";
import { readCart, readCartRaw, writeCartRaw } from "@/lib/cart";
import { enqueue } from "@/lib/jobs";

export async function addToCart(formData: FormData) {
  const variantId = Number(formData.get("variantId"));
  if (!variantId) return;
  const d = await db();
  const [v] = await d.select().from(variants).where(eq(variants.id, variantId));
  if (!v || v.stock <= 0) return;
  const raw = await readCartRaw();
  const line = raw.find(([id]) => id === variantId);
  if (line) line[1] = Math.min(line[1] + 1, v.stock);
  else raw.push([variantId, 1]);
  await writeCartRaw(raw);
  revalidatePath("/", "layout");
  if (formData.get("then") === "sepet") redirect("/sepet");
}

export async function setQty(formData: FormData) {
  const variantId = Number(formData.get("variantId"));
  const qty = Math.max(0, Math.min(10, Number(formData.get("qty"))));
  const raw = (await readCartRaw()).map(([id, q]): [number, number] => (id === variantId ? [id, qty] : [id, q]));
  await writeCartRaw(raw);
  revalidatePath("/", "layout");
}

const OrderInput = z.object({
  name: z.string().trim().min(3, "Ad soyad girin"),
  phone: z.string().trim().regex(/^[0-9 +()-]{10,}$/, "Geçerli bir telefon girin"),
  email: z.string().trim().email("Geçerli bir e-posta girin"),
  city: z.string().trim().min(2, "İl seçin"),
  address: z.string().trim().min(10, "Açık adresi girin"),
  payment: z.enum(["kart", "kapida"]),
  terms: z.literal("on", { errorMap: () => ({ message: "Mesafeli satış sözleşmesini onaylayın" }) }),
});

export type OrderState = { errors?: Record<string, string>; message?: string };

export async function placeOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const parsed = OrderInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  const cart = await readCart();
  if (!cart.lines.length) return { message: "Sepetiniz boş." };
  const d = await db();
  const no = `KMS${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await d.transaction(async (tx) => {
      for (const l of cart.lines) {
        const res = await tx
          .update(variants)
          .set({ stock: sql`${variants.stock} - ${l.qty}` })
          .where(and(eq(variants.id, l.variantId), gte(variants.stock, l.qty)))
          .returning({ id: variants.id });
        if (!res.length) throw new Error(`${l.title} (${l.size}) için yeterli stok kalmadı.`);
      }
      const v = parsed.data;
      const [o] = await tx
        .insert(orders)
        .values({
          no,
          customerName: v.name,
          phone: v.phone,
          email: v.email,
          city: v.city,
          address: v.address,
          payment: v.payment === "kart" ? "Kart (test)" : "Kapıda ödeme",
          total: cart.total,
          shipping: cart.shipping,
        })
        .returning();
      await tx.insert(orderItems).values(
        cart.lines.map((l) => ({ orderId: o.id, productId: l.productId, variantId: l.variantId, title: l.title, size: l.size, price: l.price, qty: l.qty })),
      );
    });
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Sipariş oluşturulamadı." };
  }

  await writeCartRaw([]);
  await enqueue("sync_stock", { variantIds: cart.lines.map((l) => l.variantId), orderNo: no });
  revalidatePath("/", "layout");
  redirect(`/siparis/${no}`);
}
