"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { channelListings, orders, products, variants } from "@/db/schema";
import { adminPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { enqueue } from "@/lib/jobs";
import { createShoot } from "@/lib/shoots";

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const expected = adminPassword();
  if (!expected) return { error: "Sunucuda ADMIN_PASSWORD tanımlı değil." };
  if (String(formData.get("password") ?? "") !== expected) return { error: "Şifre yanlış." };
  await startSession();
  redirect("/panel");
}

export async function logout() {
  await endSession();
  redirect("/panel/giris");
}

export async function uploadShoot(formData: FormData) {
  await requireAdmin();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const shoot = await createShoot(files, String(formData.get("note") ?? ""));
  redirect(`/panel/cekim/${shoot.id}`);
}

export async function approveProduct(formData: FormData) {
  await requireAdmin();
  const d = await db();
  const id = Number(formData.get("productId"));
  const title = String(formData.get("title") ?? "").trim();
  const price = Math.round(Number(String(formData.get("price") ?? "").replace(",", ".")) * 100);
  if (title) await d.update(products).set({ title }).where(eq(products.id, id));
  if (price > 0) await d.update(products).set({ price }).where(eq(products.id, id));
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("stock_")) continue;
    await d.update(variants).set({ stock: Math.max(0, Number(v) || 0) }).where(eq(variants.id, Number(k.slice(6))));
  }
  await enqueue("publish_product", { productId: id });
  revalidatePath("/panel", "layout");
}

export async function rejectProduct(formData: FormData) {
  await requireAdmin();
  const d = await db();
  await d.update(products).set({ status: "arsiv" }).where(eq(products.id, Number(formData.get("productId"))));
  revalidatePath("/panel", "layout");
}

export async function setProductStatus(formData: FormData) {
  await requireAdmin();
  const d = await db();
  const id = Number(formData.get("productId"));
  const status = formData.get("status") === "yayinda" ? "yayinda" : "arsiv";
  if (status === "yayinda") {
    await enqueue("publish_product", { productId: id });
  } else {
    await d.update(products).set({ status }).where(eq(products.id, id));
    await d.update(channelListings).set({ status: "bekliyor", syncedAt: new Date() }).where(eq(channelListings.productId, id));
  }
  revalidatePath("/panel", "layout");
  revalidatePath("/", "layout");
}

const ORDER_STATUSES = ["alindi", "hazirlaniyor", "kargoda", "teslim", "iptal"] as const;

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;
  const d = await db();
  await d.update(orders).set({ status: status as (typeof ORDER_STATUSES)[number] }).where(eq(orders.id, Number(formData.get("orderId"))));
  revalidatePath("/panel/siparisler");
}
