import { eq } from "drizzle-orm";
import type { DB } from "@/db";
import { assets, categories, channelListings, products, variants } from "@/db/schema";
import { SIZES, categorySlug, slugify, type Gender } from "./catalog-data";
import type { Garment } from "./garments";
import type { Copy, GeneratedImage, ItemAttrs } from "./pipeline/provider";

type NewProduct = {
  gender: Gender;
  garment: Garment;
  attrs: ItemAttrs;
  copy: Copy;
  images: GeneratedImage[];
  price: number;
  comparePrice: number | null;
  status: "taslak" | "onayda" | "yayinda";
  shootId?: number | null;
  rawUrl?: string | null;
  stock: (size: string) => number;
};

// Tek ürün kaydını, bedenleri, görselleri ve kanal kayıtlarını birlikte oluşturur.
// Hem seed hem AI hattı bunu kullanır.
export async function createProduct(d: DB, p: NewProduct) {
  const [cat] = await d.select().from(categories).where(eq(categories.slug, categorySlug(p.gender, p.garment)));
  if (!cat) throw new Error(`Kategori yok: ${p.gender}/${p.garment}`);
  const temp = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [row] = await d
    .insert(products)
    .values({
      slug: temp,
      title: p.copy.title,
      description: p.copy.description,
      categoryId: cat.id,
      shootId: p.shootId ?? null,
      color: p.attrs.color,
      colorHex: p.attrs.colorHex,
      pattern: p.attrs.pattern,
      fabric: p.attrs.fabric,
      fit: p.attrs.style,
      price: p.price,
      comparePrice: p.comparePrice,
      status: p.status,
      attrs: p.attrs.attrs,
      publishedAt: p.status === "yayinda" ? new Date() : null,
    })
    .returning();
  const slug = `${slugify(`${p.attrs.color} ${p.copy.title}`)}-${row.id}`;
  await d.update(products).set({ slug }).where(eq(products.id, row.id));

  await d.insert(variants).values(
    SIZES[p.gender].map((size, i) => ({
      productId: row.id,
      size,
      sku: `KMS-${String(row.id).padStart(5, "0")}-${size}`,
      barcode: `869${String(row.id).padStart(6, "0")}${String(i).padStart(3, "0")}`,
      stock: p.stock(size),
    })),
  );

  const imgs: (typeof assets.$inferInsert)[] = [
    ...p.images.filter((i) => i.view !== "duz").map((i, n) => ({ productId: row.id, kind: "manken" as const, url: i.url, model: i.model, qcScore: i.qcScore, sort: n })),
    ...p.images.filter((i) => i.view === "duz").map((i) => ({ productId: row.id, kind: "kesik" as const, url: i.url, model: i.model, qcScore: i.qcScore, sort: 10 })),
  ];
  if (p.rawUrl) imgs.push({ productId: row.id, kind: "ham" as const, url: p.rawUrl, model: "", qcScore: 100, sort: 20 });
  await d.insert(assets).values(imgs);

  await d.insert(channelListings).values(
    (["site", "trendyol", "instagram"] as const).map((channel) => ({ productId: row.id, channel, status: "bekliyor" as const })),
  );
  return { ...row, slug };
}
