import manifest from "../../public/stock/manifest.json";

// Demo katalog fotoğrafları: Openverse üzerinden CC0 / kamu malı / CC BY lisanslı görseller.
// Ürün kendi fotoğrafımız değil; satışa açılmadan önce gerçek çekimlerle değiştirilecek.

export type StockPhoto = {
  file: string;
  detail: string;
  colorHex: string;
  creator: string;
  license: string;
  licenseUrl: string | null;
  source: string | null;
};

export const STOCK = manifest as Record<string, StockPhoto[]>;

export const stockFor = (categorySlug: string): StockPhoto[] => STOCK[categorySlug] ?? [];

// assets.model alanında atıf: "stock|<fotoğrafçı>|<lisans>|<lisans url>|<kaynak url>"
export const stockModel = (p: StockPhoto) => ["stock", p.creator, p.license, p.licenseUrl ?? "", p.source ?? ""].map((s) => s.replace(/\|/g, "/")).join("|");

export const isStockModel = (model: string | null | undefined) => !!model?.startsWith("stock|");

export function parseStockModel(model: string) {
  const [, creator, license, licenseUrl, source] = model.split("|");
  return { creator, license, licenseUrl: licenseUrl || null, source: source || null };
}
