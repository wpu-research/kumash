import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { assets, products, variants } from "@/db/schema";
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from "./catalog-data";

// Sepet çerezde [varyantId, adet] çiftleri olarak tutulur; fiyat ve stok her okumada veritabanından gelir.
export const CART_COOKIE = "kms_cart";
export type CartRaw = [number, number][];

export async function readCartRaw(): Promise<CartRaw> {
  const v = (await cookies()).get(CART_COOKIE)?.value;
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((x) => Array.isArray(x) && x.length === 2).map(([a, b]) => [Number(a), Number(b)]) : [];
  } catch {
    return [];
  }
}

export async function writeCartRaw(raw: CartRaw) {
  (await cookies()).set(CART_COOKIE, JSON.stringify(raw.filter(([, q]) => q > 0)), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function cartCount() {
  return (await readCartRaw()).reduce((s, [, q]) => s + q, 0);
}

export type CartLine = {
  variantId: number;
  productId: number;
  slug: string;
  title: string;
  color: string;
  size: string;
  price: number;
  comparePrice: number | null;
  qty: number;
  stock: number;
  image: string;
};

export async function readCart() {
  const raw = await readCartRaw();
  if (!raw.length) return { lines: [] as CartLine[], subtotal: 0, shipping: 0, total: 0, count: 0, savings: 0 };
  const d = await db();
  const ids = raw.map(([v]) => v);
  const rows = await d
    .select({ v: variants, p: products })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(and(inArray(variants.id, ids), eq(products.status, "yayinda")));
  const imgs = rows.length
    ? await d.select().from(assets).where(and(inArray(assets.productId, rows.map((r) => r.p.id)), eq(assets.kind, "manken")))
    : [];
  const lines: CartLine[] = raw
    .map(([vid, qty]) => {
      const r = rows.find((x) => x.v.id === vid);
      if (!r) return null;
      return {
        variantId: vid,
        productId: r.p.id,
        slug: r.p.slug,
        title: r.p.title,
        color: r.p.color,
        size: r.v.size,
        price: r.p.price,
        comparePrice: r.p.comparePrice,
        qty: Math.min(qty, Math.max(r.v.stock, 0)),
        stock: r.v.stock,
        image: imgs.find((i) => i.productId === r.p.id)?.url ?? "",
      };
    })
    .filter((l): l is CartLine => !!l);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const savings = lines.reduce((s, l) => s + (l.comparePrice ? (l.comparePrice - l.price) * l.qty : 0), 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  return { lines, subtotal, shipping, total: subtotal + shipping, count: lines.reduce((s, l) => s + l.qty, 0), savings };
}
