import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { garmentImageUrl, sheenFor } from "../garments";
import type { AnalyzedItem, GeneratedImage, ShootPhotos } from "./provider";

// Claude'a gönderilmeden önce: EXIF yönü düzeltilir, uzun kenar 1568 px'e indirilir, JPEG'e çevrilir.
export async function prepareForVision(file: string) {
  const buf = await sharp(file).rotate().resize({ width: 1568, height: 1568, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  return buf.toString("base64");
}

// Parçanın kutusunu fotoğraftan keser (kenarlara %4 pay bırakır) ve çekim klasörüne kaydeder.
async function cropItem(file: string, box: NonNullable<AnalyzedItem["box"]>, outDir: string, name: string) {
  const rotated = await sharp(file).rotate().toBuffer();
  const meta = await sharp(rotated).metadata();
  const W = meta.width ?? 0, H = meta.height ?? 0;
  if (!W || !H) return null;
  const pad = 40;
  const left = Math.floor((Math.max(0, box.x0 - pad) / 1000) * W);
  const top = Math.floor((Math.max(0, box.y0 - pad) / 1000) * H);
  const width = Math.min(W - left, Math.ceil(((Math.min(1000, box.x1 + pad) - Math.max(0, box.x0 - pad)) / 1000) * W));
  const height = Math.min(H - top, Math.ceil(((Math.min(1000, box.y1 + pad) - Math.max(0, box.y0 - pad)) / 1000) * H));
  if (width < 24 || height < 24) return null;
  await mkdir(outDir, { recursive: true });
  await sharp(rotated).extract({ left, top, width, height }).resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(path.join(outDir, name));
  return name;
}

// Ürün görselleri: AI manken (ön, arka) Claude'un okuduğu renk ve desenle çizilir;
// kutu varsa fotoğraftan gerçek kesit "düz çekim" olur, yoksa düz çizim kullanılır.
export async function renderItemImages(item: AnalyzedItem, shootId: number, photos: ShootPhotos): Promise<GeneratedImage[]> {
  const base = { g: item.garment, color: item.attrs.colorHex, pattern: item.attrs.pattern, sheen: sheenFor(item.attrs.fabric) };
  const qc = Math.round(70 + item.confidence * 28);
  const images: GeneratedImage[] = [
    { url: garmentImageUrl({ ...base, view: "manken" }), view: "manken", model: "kumash-svg", qcScore: qc },
    { url: garmentImageUrl({ ...base, view: "arka" }), view: "arka", model: "kumash-svg", qcScore: qc },
  ];
  const src = photos.paths[item.photoIndex];
  if (item.box && src) {
    try {
      const dir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads", "shoots", String(shootId));
      const name = await cropItem(src, item.box, dir, `parca-${item.index + 1}.jpg`);
      if (name) {
        images.push({ url: `/uploads/shoots/${shootId}/${name}`, view: "duz", model: "foto-kesit", qcScore: 100 });
        return images;
      }
    } catch {
      // kesit alınamazsa çizime düş
    }
  }
  images.push({ url: garmentImageUrl({ ...base, view: "duz" }), view: "duz", model: "kumash-svg", qcScore: 97 });
  return images;
}

export async function writeUpload(dir: string, name: string, data: Buffer) {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
}
