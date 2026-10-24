import type { DB } from "@/db";
import { channelListings } from "@/db/schema";

export const CHANNELS = ["site", "trendyol", "instagram", "facebook"] as const;
export type Channel = (typeof CHANNELS)[number];
type Result = { status: "yayinda" | "kimlik_yok" | "hata"; externalId?: string; error?: string };

// Her kanal ortak ürün kaydını kendi formatına çevirip yayınlar ve sonucu channel_listings'e yazar.
// Trendyol, Instagram ve Facebook kimlik bilgileri girilene kadar "kimlik_yok" döner; gerçek API çağrıları Faz 2'de.

export function channelReady(ch: Channel) {
  switch (ch) {
    case "site":
      return true;
    case "trendyol":
      return !!(process.env.TRENDYOL_SUPPLIER_ID && process.env.TRENDYOL_API_KEY && process.env.TRENDYOL_API_SECRET);
    case "instagram":
      return !!(process.env.INSTAGRAM_BUSINESS_ID && process.env.INSTAGRAM_ACCESS_TOKEN);
    case "facebook":
      return !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);
  }
}

const MISSING: Record<Exclude<Channel, "site">, string> = {
  trendyol: "Trendyol satıcı ID ve API anahtarı girilmedi",
  instagram: "Instagram Business hesabı ve erişim anahtarı girilmedi",
  facebook: "Facebook sayfa ID ve sayfa erişim anahtarı girilmedi",
};

async function publish(ch: Channel, productId: number): Promise<Result> {
  if (ch === "site") return { status: "yayinda", externalId: String(productId) };
  if (!channelReady(ch)) return { status: "kimlik_yok", error: MISSING[ch] };
  return { status: "hata", error: `${ch} yayını henüz bağlanmadı (Faz 2)` };
}

export async function publishEverywhere(d: DB, productId: number, log: (m: string) => Promise<void>, only?: readonly Channel[]) {
  for (const ch of only?.length ? only : CHANNELS) {
    const r = await publish(ch, productId);
    const values = { status: r.status, externalId: r.externalId ?? null, lastError: r.error ?? null, syncedAt: new Date() };
    // Kanal sonradan eklendiyse (ör. facebook) eski ürünlerde kayıt yoktur; upsert ile oluşur.
    await d
      .insert(channelListings)
      .values({ productId, channel: ch, ...values })
      .onConflictDoUpdate({ target: [channelListings.productId, channelListings.channel], set: values });
    await log(`${ch}: ${r.status}${r.error ? ` (${r.error})` : ""}`);
  }
}
