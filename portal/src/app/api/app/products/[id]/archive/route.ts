import { eq } from "drizzle-orm";
import { db } from "@/db";
import { channelListings, products } from "@/db/schema";
import { appRoute, getOne, intParam } from "@/lib/app-api";

export const dynamic = "force-dynamic";

// Reddet (onaydaysa) ya da yayından kaldır: ürün arşive gider, kanal kayıtları beklemeye döner.
export const POST = appRoute<{ id: string }>(async (req, { id }) => {
  const productId = intParam(id);
  await getOne(req, productId);
  const d = await db();
  await d.update(products).set({ status: "arsiv" }).where(eq(products.id, productId));
  await d.update(channelListings).set({ status: "bekliyor", syncedAt: new Date() }).where(eq(channelListings.productId, productId));
  return { product: await getOne(req, productId) };
});
