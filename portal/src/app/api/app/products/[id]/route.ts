import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, variants } from "@/db/schema";
import { ApiError, appRoute, getOne, intParam } from "@/lib/app-api";

export const dynamic = "force-dynamic";

export const GET = appRoute<{ id: string }>(async (req, { id }) => ({ product: await getOne(req, intParam(id)) }));

const Patch = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  price: z.number().int().min(100).max(10_000_000).optional(), // kuruş
  comparePrice: z.number().int().min(100).max(10_000_000).nullable().optional(),
  stock: z.record(z.string(), z.number().int().min(0).max(100_000)).optional(), // variantId → adet
});

export const PATCH = appRoute<{ id: string }>(async (req, { id }) => {
  const productId = intParam(id);
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Geçersiz veri");
  const { stock, ...fields } = parsed.data;
  if (fields.comparePrice != null && fields.price != null && fields.comparePrice <= fields.price) {
    throw new ApiError(400, "İndirimsiz fiyat satış fiyatından yüksek olmalı");
  }
  const d = await db();
  await getOne(req, productId);
  if (Object.keys(fields).length) await d.update(products).set(fields).where(eq(products.id, productId));
  for (const [vid, n] of Object.entries(stock ?? {})) {
    await d.update(variants).set({ stock: n }).where(and(eq(variants.id, Number(vid)), eq(variants.productId, productId)));
  }
  return { product: await getOne(req, productId) };
});
