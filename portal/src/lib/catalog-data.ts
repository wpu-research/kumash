import type { Garment, Pattern } from "./garments";

export type Gender = "kadin" | "erkek";

export const CATEGORY_DEFS: { gender: Gender; garment: Garment; name: string }[] = [
  { gender: "kadin", garment: "elbise", name: "Elbise" },
  { gender: "kadin", garment: "bluz", name: "Bluz" },
  { gender: "kadin", garment: "gomlek", name: "Gömlek" },
  { gender: "kadin", garment: "etek", name: "Etek" },
  { gender: "kadin", garment: "pantolon", name: "Pantolon" },
  { gender: "kadin", garment: "ceket", name: "Ceket" },
  { gender: "kadin", garment: "kazak", name: "Kazak" },
  { gender: "kadin", garment: "tisort", name: "Tişört" },
  { gender: "erkek", garment: "tisort", name: "Tişört" },
  { gender: "erkek", garment: "gomlek", name: "Gömlek" },
  { gender: "erkek", garment: "pantolon", name: "Pantolon" },
  { gender: "erkek", garment: "kazak", name: "Kazak" },
  { gender: "erkek", garment: "ceket", name: "Ceket" },
  { gender: "erkek", garment: "mont", name: "Mont" },
  { gender: "erkek", garment: "sort", name: "Şort" },
];

export const categorySlug = (gender: Gender, garment: Garment) => `${gender}-${garment}`;

export const COLORS: { name: string; hex: string }[] = [
  { name: "Bordo", hex: "#8E1236" },
  { name: "Siyah", hex: "#1E1C1D" },
  { name: "Ekru", hex: "#F2EFEA" },
  { name: "Lacivert", hex: "#1F2A44" },
  { name: "Haki", hex: "#5E6B45" },
  { name: "Zümrüt", hex: "#0F5B45" },
  { name: "Hardal", hex: "#C99A2E" },
  { name: "Pudra", hex: "#D9A9B3" },
  { name: "Kahve", hex: "#6B4E3D" },
  { name: "Bej", hex: "#D8C3A5" },
  { name: "Mavi", hex: "#3E6FB0" },
  { name: "Gri", hex: "#8A8D91" },
  { name: "Kiremit", hex: "#B85C38" },
  { name: "Lila", hex: "#A493C6" },
];

export const FABRICS: Record<Garment, string[]> = {
  elbise: ["Saten", "Krep", "Viskon", "Keten"],
  bluz: ["Saten", "Şifon", "Viskon"],
  gomlek: ["Pamuk Poplin", "Keten", "Oxford"],
  etek: ["Saten", "Yün Karışımlı", "Denim", "Krep"],
  pantolon: ["Gabardin", "Denim", "Keten", "Yün Karışımlı"],
  ceket: ["Yün Karışımlı", "Keten", "Krep"],
  kazak: ["Triko", "Yün Karışımlı"],
  tisort: ["Pamuk Penye", "Modal"],
  mont: ["Su İtici", "Deri Görünümlü"],
  sort: ["Denim", "Keten", "Gabardin"],
};

export const STYLES: Record<Garment, string[]> = {
  elbise: ["Midi", "Maxi", "Mini", "Askılı", "Kruvaze", "Gömlek Yaka"],
  bluz: ["Kruvaze", "V Yaka", "Bağcıklı", "Fırfırlı"],
  gomlek: ["Oversize", "Slim Fit", "Regular Fit", "Cepli"],
  etek: ["Midi", "Mini", "Pileli", "Kalem", "A Kesim"],
  pantolon: ["Geniş Paça", "Palazzo", "Slim Fit", "Kumaş", "Mom Fit"],
  ceket: ["Blazer", "Kruvaze", "Oversize"],
  kazak: ["Balıkçı Yaka", "Bisiklet Yaka", "Örgü Desenli"],
  tisort: ["Basic", "Oversize", "Polo Yaka"],
  mont: ["Şişme", "Kapüşonlu", "Uzun"],
  sort: ["Bermuda", "Paperbag", "Basic"],
};

export const GARMENT_NAME: Record<Garment, string> = {
  elbise: "Elbise", bluz: "Bluz", gomlek: "Gömlek", etek: "Etek", pantolon: "Pantolon",
  ceket: "Ceket", kazak: "Kazak", tisort: "Tişört", mont: "Mont", sort: "Şort",
};

export const BASE_PRICE: Record<Garment, number> = {
  tisort: 299, bluz: 549, gomlek: 649, kazak: 749, ceket: 1499, mont: 2299, elbise: 899, etek: 599, pantolon: 799, sort: 449,
};

export const PATTERN_NAME: Record<Pattern, string> = { duz: "Düz", cizgili: "Çizgili", puantiyeli: "Puantiyeli", kareli: "Kareli" };

export const SIZES: Record<Gender, string[]> = { kadin: ["XS", "S", "M", "L", "XL"], erkek: ["S", "M", "L", "XL", "XXL"] };

export const FREE_SHIPPING_FROM = 50000; // kuruş: 500 TL üstü kargo bedava
export const SHIPPING_FEE = 4999;

export function slugify(s: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  return s
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function tl(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(kurus / 100);
}

// Tohumlu rastgele sayı üreteci: seed ve mock AI her çalıştırmada aynı sonucu versin.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];

export const SORTS = {
  onerilen: "Önerilen",
  yeni: "En yeniler",
  ucuz: "En düşük fiyat",
  pahali: "En yüksek fiyat",
} as const;
export type SortKey = keyof typeof SORTS;

// Hex renge en yakın palet rengi (filtrelerde kullanılan ad)
export function nearestColor(hex: string) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = rgb(hex);
  const dist = (h: string) => { const [cr, cg, cb] = rgb(h); return (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2; };
  return COLORS.reduce((best, c) => (dist(c.hex) < dist(best.hex) ? c : best));
}
