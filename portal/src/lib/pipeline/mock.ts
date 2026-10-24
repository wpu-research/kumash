import type { Garment } from "../garments";
import { COLORS, FABRICS, GARMENT_NAME, PATTERN_NAME, STYLES, pick, rng, type Gender } from "../catalog-data";
import type { AiProvider, Copy, ItemAttrs } from "./provider";

// Mock sağlayıcı: API anahtarı yokken hattın uçtan uca çalışmasını sağlar.
// Fotoğrafa bakmaz; çekim numarasından tohumlanmış tutarlı sonuçlar üretir. Seed de bunu kullanır.

const SHOOT_SETS: { gender: Gender; items: Garment[] }[] = [
  { gender: "kadin", items: ["bluz", "etek", "ceket"] },
  { gender: "kadin", items: ["elbise", "ceket", "gomlek"] },
  { gender: "kadin", items: ["kazak", "pantolon", "tisort", "etek"] },
  { gender: "erkek", items: ["gomlek", "pantolon", "ceket"] },
  { gender: "erkek", items: ["tisort", "sort", "mont"] },
];

export function describeLocal(item: { garment: Garment }, seed: number): ItemAttrs {
  const r = rng(seed * 7919 + 13);
  const c = pick(r, COLORS);
  const fabric = pick(r, FABRICS[item.garment]);
  const pattern = r() < 0.72 ? "duz" : pick(r, ["cizgili", "puantiyeli", "kareli"] as const);
  const style = pick(r, STYLES[item.garment]);
  const attrs: Record<string, string> = { Kumaş: fabric, Desen: PATTERN_NAME[pattern], Kalıp: style };
  if (["tisort", "bluz", "gomlek", "kazak", "elbise"].includes(item.garment)) attrs["Kol Boyu"] = item.garment === "tisort" || item.garment === "bluz" ? "Kısa Kol" : "Uzun Kol";
  if (["elbise", "etek"].includes(item.garment)) attrs["Boy"] = style === "Mini" ? "Mini" : style === "Maxi" ? "Maxi" : "Midi";
  return { color: c.name, colorHex: c.hex, pattern, fabric, style, attrs };
}

export function copyLocal(item: { garment: Garment }, a: ItemAttrs): Copy {
  const name = GARMENT_NAME[item.garment];
  const title = `${a.fabric} ${a.style} ${name}`.replace(/(\b\w+\b) \1/g, "$1");
  const pattern = a.pattern === "duz" ? "" : `${PATTERN_NAME[a.pattern].toLowerCase()} `;
  const description =
    `${a.color} renkte, ${pattern}${a.fabric.toLowerCase()} kumaştan ${a.style.toLowerCase()} ${name.toLowerCase()}. ` +
    `Günlük kullanıma da özel davetlere de uyum sağlayan, kombinlemesi kolay bir parça. ` +
    `Ürün ölçüleri gerçek ürün üzerinden alınmıştır; beden tablosunu inceleyerek seçim yapabilirsiniz.`;
  return { title, description };
}

export const mockProvider: AiProvider = {
  name: "mock",
  async analyze(_photos, seed) {
    const set = SHOOT_SETS[seed % SHOOT_SETS.length];
    const items = set.items.map((garment, index) => {
      const attrs = describeLocal({ garment }, seed * 31 + index);
      return { index, garment, gender: set.gender, box: null, photoIndex: 0, attrs, copy: copyLocal({ garment }, attrs), confidence: 0.9 };
    });
    return { items, model: "mock", costCents: 0, notes: ["Mock sağlayıcı: fotoğrafa bakılmadı."] };
  },
};
