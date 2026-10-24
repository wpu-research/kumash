import { eq, sql } from "drizzle-orm";
import type { DB } from "./index";
import { assets, categories, orders, outfits, products, shoots } from "./schema";
import { BASE_PRICE, CATEGORY_DEFS, categorySlug, nearestColor, rng, type Gender } from "@/lib/catalog-data";
import { garmentImageUrl, isBottom, isTop, sheenFor, type Garment } from "@/lib/garments";
import { copyLocal, describeLocal } from "@/lib/pipeline/mock";
import { createProduct } from "@/lib/products";
import { publishEverywhere } from "@/lib/publishers";
import { stockFor, stockModel } from "@/lib/stock";
import type { GeneratedImage } from "@/lib/pipeline/provider";

// Demo katalog: her kategoriden 8-10 yayında ürün + kombinler. Ürün varsa dokunmaz (false döner).
export async function seedDemo(d: DB): Promise<boolean> {
  const existing = await d.select({ id: products.id }).from(products).limit(1);
  if (existing.length) {
    // Eski (çizimli) demo katalog, gerçek veri yoksa fotoğraflı katalogla değiştirilir:
    // sipariş ya da çekim varsa veya fotoğraflı katalog zaten yüklüyse dokunulmaz.
    const count = sql<number>`count(*)`.mapWith(Number);
    const [[o], [sh], [st]] = await Promise.all([
      d.select({ n: count }).from(orders),
      d.select({ n: count }).from(shoots),
      d.select({ n: count }).from(assets).where(sql`${assets.model} like 'stock|%'`),
    ]);
    if (o.n > 0 || sh.n > 0 || st.n > 0) return false;
    await d.delete(outfits);
    await d.delete(products); // varyant, görsel ve kanal kayıtları cascade ile silinir
  }

  await d
    .insert(categories)
    .values(CATEGORY_DEFS.map((c, i) => ({ slug: categorySlug(c.gender, c.garment), name: c.name, gender: c.gender, garment: c.garment, sort: i })))
    .onConflictDoNothing();

  const made: { id: number; gender: Gender; garment: Garment; colorHex: string }[] = [];
  let seed = 1;
  for (const c of CATEGORY_DEFS) {
    // Fotoğrafı olan kategoride her fotoğraf bir ürün; olmayan kategoride 3 çizimli ürün
    const photos = stockFor(categorySlug(c.gender, c.garment));
    const count = photos.length || 3;
    for (let n = 0; n < count; n++, seed++) {
      const r = rng(seed * 997);
      const photo = photos[n];
      const base0 = describeLocal({ garment: c.garment }, seed);
      const attrs = photo
        ? { ...base0, color: nearestColor(photo.colorHex).name, colorHex: photo.colorHex, pattern: "duz" as const, attrs: { ...base0.attrs, Desen: "Düz" } }
        : base0;
      const copy = copyLocal({ garment: c.garment }, attrs);
      const base = { g: c.garment, color: attrs.colorHex, pattern: attrs.pattern, sheen: sheenFor(attrs.fabric) };
      const price = Math.round(BASE_PRICE[c.garment] * (0.8 + r() * 0.6)) * 100 - 1;
      const discounted = r() < 0.35;
      const images: GeneratedImage[] = photo
        ? [
            { url: photo.file, view: "manken", model: stockModel(photo), qcScore: 100 },
            { url: photo.detail, view: "manken", model: stockModel(photo), qcScore: 100 },
          ]
        : [
            { url: garmentImageUrl({ ...base, view: "manken" }), view: "manken", model: "mock-tryon", qcScore: 90 + Math.floor(r() * 9) },
            { url: garmentImageUrl({ ...base, view: "arka" }), view: "arka", model: "mock-tryon", qcScore: 88 },
            { url: garmentImageUrl({ ...base, view: "duz" }), view: "duz", model: "mock-cutout", qcScore: 97 },
          ];
      const p = await createProduct(d, {
        gender: c.gender,
        garment: c.garment,
        attrs,
        copy,
        images,
        price,
        comparePrice: discounted ? Math.round((price * (1.2 + r() * 0.25)) / 100) * 100 - 1 : null,
        status: "yayinda",
        stock: () => (r() < 0.12 ? 0 : Math.floor(r() * 25) + 1),
      });
      await publishEverywhere(d, p.id, async () => {});
      // yayın tarihlerini son 45 güne dağıt: "Yeni gelenler" karışık kategorilerden gelsin
      const ago = new Date(Date.now() - Math.floor(r() * 45 * 24 + 1) * 3600 * 1000);
      await d.update(products).set({ publishedAt: ago, createdAt: ago }).where(eq(products.id, p.id));
      made.push({ id: p.id, gender: c.gender, garment: c.garment, colorHex: attrs.colorHex });
    }
  }

  // Kombinler: aynı cinsiyetten bir üst + bir alt (+ bazen ceket)
  const r = rng(42);
  const names = ["Hafta Sonu", "Ofis Şıklığı", "Akşam Yemeği", "Şehir Turu", "Sonbahar", "Minimal", "Kahve Molası", "Davet"];
  for (let i = 0; i < 28; i++) {
    const gender: Gender = i % 3 === 2 ? "erkek" : "kadin";
    const tops = made.filter((m) => m.gender === gender && isTop(m.garment) && m.garment !== "ceket" && m.garment !== "mont");
    const bottoms = made.filter((m) => m.gender === gender && isBottom(m.garment));
    const outer = made.filter((m) => m.gender === gender && (m.garment === "ceket" || m.garment === "mont"));
    const ids = [tops[Math.floor(r() * tops.length)].id, bottoms[Math.floor(r() * bottoms.length)].id];
    if (r() < 0.45 && outer.length) ids.push(outer[Math.floor(r() * outer.length)].id);
    await d.insert(outfits).values({ name: `${names[i % names.length]} Kombini`, productIds: ids });
  }

  return true;
}
