import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { assets, categories, outfits, products, variants } from "@/db/schema";
import type { Gender } from "./catalog-data";

export type CardProduct = {
  id: number;
  slug: string;
  title: string;
  color: string;
  colorHex: string;
  price: number;
  comparePrice: number | null;
  image: string;
  image2: string | null;
  stock: number;
  createdAt: Date;
  categoryName: string;
  gender: Gender;
};

import { SORTS, type SortKey } from "./catalog-data";
export { SORTS, type SortKey };

export type ListFilter = {
  gender?: Gender;
  categorySlug?: string;
  q?: string;
  colors?: string[];
  sizes?: string[];
  min?: number;
  max?: number;
  discounted?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export async function getCategories() {
  const d = await db();
  return d.select().from(categories).orderBy(asc(categories.sort));
}

export async function getCategory(slug: string) {
  const d = await db();
  const [c] = await d.select().from(categories).where(eq(categories.slug, slug));
  return c ?? null;
}

async function attachImages(rows: Omit<CardProduct, "image" | "image2">[]): Promise<CardProduct[]> {
  if (!rows.length) return [];
  const d = await db();
  const imgs = await d
    .select({ productId: assets.productId, url: assets.url, sort: assets.sort })
    .from(assets)
    .where(and(inArray(assets.productId, rows.map((r) => r.id)), inArray(assets.kind, ["manken", "kesik"])))
    .orderBy(asc(assets.sort));
  return rows.map((r) => {
    const mine = imgs.filter((i) => i.productId === r.id);
    return { ...r, image: mine[0]?.url ?? "", image2: mine.at(-1)?.url ?? null };
  });
}

const stockSum = sql<number>`coalesce((select sum(${variants.stock}) from ${variants} where ${variants.productId} = ${products.id}), 0)`.mapWith(Number);

const cardFields = {
  id: products.id,
  slug: products.slug,
  title: products.title,
  color: products.color,
  colorHex: products.colorHex,
  price: products.price,
  comparePrice: products.comparePrice,
  createdAt: products.createdAt,
  stock: stockSum,
  categoryName: categories.name,
  gender: categories.gender,
};

export async function listProducts(f: ListFilter) {
  const d = await db();
  const where: SQL[] = [eq(products.status, "yayinda")];
  if (f.gender) where.push(eq(categories.gender, f.gender));
  if (f.categorySlug) where.push(eq(categories.slug, f.categorySlug));
  if (f.q) {
    const like = `%${f.q.trim()}%`;
    where.push(or(ilike(products.title, like), ilike(products.color, like), ilike(products.fabric, like), ilike(categories.name, like))!);
  }
  if (f.colors?.length) where.push(inArray(products.color, f.colors));
  if (f.min != null) where.push(gte(products.price, f.min * 100));
  if (f.max != null) where.push(lte(products.price, f.max * 100));
  if (f.discounted) where.push(isNotNull(products.comparePrice));
  if (f.sizes?.length) {
    where.push(
      sql`exists (select 1 from ${variants} where ${variants.productId} = ${products.id} and ${variants.stock} > 0 and ${inArray(variants.size, f.sizes)})`,
    );
  }
  const order =
    f.sort === "ucuz" ? [asc(products.price)] : f.sort === "pahali" ? [desc(products.price)] : f.sort === "yeni" ? [desc(products.publishedAt), desc(products.id)] : [desc(sql`${stockSum} > 0`), desc(sql`exists (select 1 from ${assets} where ${assets.productId} = ${products.id} and ${assets.model} like 'stock|%')`), asc(sql`(${products.id} * 7919) % 101`)];
  const perPage = f.perPage ?? 24;
  const page = Math.max(1, f.page ?? 1);
  const base = d.select(cardFields).from(products).innerJoin(categories, eq(categories.id, products.categoryId)).where(and(...where));
  const [rows, [{ count }]] = await Promise.all([
    base.orderBy(...order).limit(perPage).offset((page - 1) * perPage),
    d.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(products).innerJoin(categories, eq(categories.id, products.categoryId)).where(and(...where)),
  ]);
  return { items: await attachImages(rows), total: count, page, pages: Math.max(1, Math.ceil(count / perPage)) };
}

export async function colorFacets(gender?: Gender, categorySlug?: string) {
  const d = await db();
  const where: SQL[] = [eq(products.status, "yayinda")];
  if (gender) where.push(eq(categories.gender, gender));
  if (categorySlug) where.push(eq(categories.slug, categorySlug));
  return d
    .select({ color: products.color, hex: products.colorHex, n: sql<number>`count(*)`.mapWith(Number) })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...where))
    .groupBy(products.color, products.colorHex)
    .orderBy(desc(sql`count(*)`));
}

export async function getProductsByIds(ids: number[]) {
  if (!ids.length) return [];
  const d = await db();
  const rows = await d
    .select(cardFields)
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(inArray(products.id, ids), eq(products.status, "yayinda")));
  const withImg = await attachImages(rows);
  return ids.map((id) => withImg.find((p) => p.id === id)).filter(Boolean) as CardProduct[];
}

export async function getProduct(slug: string) {
  const d = await db();
  const [row] = await d
    .select({ p: products, c: categories })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.status, "yayinda")));
  if (!row) return null;
  const [vs, imgs, outs] = await Promise.all([
    d.select().from(variants).where(eq(variants.productId, row.p.id)).orderBy(asc(variants.id)),
    d.select().from(assets).where(eq(assets.productId, row.p.id)).orderBy(asc(assets.sort)),
    d.select().from(outfits).where(sql`${outfits.productIds} @> ${JSON.stringify([row.p.id])}::jsonb`).limit(3),
  ]);
  return { product: row.p, category: row.c, variants: vs, assets: imgs, outfits: outs };
}

export async function getOutfits(limit = 8) {
  const d = await db();
  const outs = await d.select().from(outfits).orderBy(desc(outfits.id)).limit(limit);
  const all = await getProductsByIds([...new Set(outs.flatMap((o) => o.productIds))]);
  return outs
    .map((o) => ({ ...o, items: o.productIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as CardProduct[] }))
    .filter((o) => o.items.length >= 2);
}
