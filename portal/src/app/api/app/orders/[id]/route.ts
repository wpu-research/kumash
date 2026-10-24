import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ApiError, appRoute, intParam } from "@/lib/app-api";

export const dynamic = "force-dynamic";

const Body = z.object({ status: z.enum(["alindi", "hazirlaniyor", "kargoda", "teslim", "iptal"]) });

export const PATCH = appRoute<{ id: string }>(async (req, { id }) => {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new ApiError(400, "Geçersiz sipariş durumu");
  const d = await db();
  const [o] = await d.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, intParam(id))).returning();
  if (!o) throw new ApiError(404, "Sipariş bulunamadı");
  return { ok: true, status: o.status };
});
