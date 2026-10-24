import type { Garment, Pattern, View } from "../garments";
import type { Gender } from "../catalog-data";

// AI sağlayıcısı arabirimi. Bir çekim iki adımda işlenir:
//   analyze → fotoğraftaki parçaları bul, özelliklerini oku, metnini yaz (Claude ya da mock)
//   render  → her parça için manken / düz çekim görsellerini üret (render.ts, sağlayıcıdan bağımsız)

export type ItemAttrs = {
  color: string;
  colorHex: string;
  pattern: Pattern;
  fabric: string;
  style: string;
  attrs: Record<string, string>;
};

export type Copy = { title: string; description: string };

// Kutu: fotoğrafa göre 0-1000 ölçekli [sol, üst, sağ, alt]
export type Box = { x0: number; y0: number; x1: number; y1: number };

export type AnalyzedItem = {
  index: number;
  garment: Garment;
  gender: Gender;
  box: Box | null;
  photoIndex: number;
  attrs: ItemAttrs;
  copy: Copy;
  confidence: number;
};

export type ShootAnalysis = { items: AnalyzedItem[]; model: string; costCents: number; notes: string[] };

export type GeneratedImage = { url: string; view: View; model: string; qcScore: number };

export type ShootPhotos = { urls: string[]; paths: string[] };

export interface AiProvider {
  name: string;
  analyze(photos: ShootPhotos, seed: number): Promise<ShootAnalysis>;
}

// Tekrar denemekle düzelmeyecek hatalar (ret, kesik yanıt, geçersiz istek): iş kuyruğu bunları yeniden denemez.
export class PermanentError extends Error {}
