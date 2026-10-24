import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { channelListings } from "@/db/schema";

type Channel = "site" | "trendyol" | "instagram";
type Result = { status: "yayinda" | "kimlik_yok" | "hata"; externalId?: string; error?: string };

// Her kanal ortak ürün kaydını kendi formatına çevirip yayınlar ve sonucu channel_listings'e yazar.
// Trendyol ve Instagram kimlik bilgileri girilene kadar "kimlik_yok" döner; gerçek API çağrıları Faz 2'de.

const publishers: Record<Channel, (productId: number) => Promise<Result>> = {
  async site(productId) {
    return { status: "yayinda", externalId: String(productId) };
  },
  async trendyol() {
    if (!process.env.TRENDYOL_SUPPLIER_ID || !process.env.TRENDYOL_API_KEY || !process.env.TRENDYOL_API_SECRET) {
      return { status: "kimlik_yok", error: "Trendyol satıcı ID ve API anahtarı girilmedi" };
    }
    return { status: "hata", error: "Trendyol ürün gönderimi henüz bağlanmadı (Faz 2)" };
  },
  async instagram() {
    if (!process.env.INSTAGRAM_BUSINESS_ID || !process.env.INSTAGRAM_ACCESS_TOKEN) {
      return { status: "kimlik_yok", error: "Instagram Business hesabı ve erişim anahtarı girilmedi" };
    }
    return { status: "hata", error: "Instagram yayını henüz bağlanmadı" };
  },
};

export async function publishEverywhere(d: DB, productId: number, log: (m: string) => Promise<void>) {
  for (const ch of ["site", "trendyol", "instagram"] as const) {
    const r = await publishers[ch](productId);
    await d
      .update(channelListings)
      .set({ status: r.status, externalId: r.externalId ?? null, lastError: r.error ?? null, syncedAt: new Date() })
      .where(and(eq(channelListings.productId, productId), eq(channelListings.channel, ch)));
    await log(`${ch}: ${r.status}${r.error ? ` (${r.error})` : ""}`);
  }
}
