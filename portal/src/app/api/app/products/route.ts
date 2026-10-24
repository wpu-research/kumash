import { db } from "@/db";
import { appRoute, loadProducts, origin } from "@/lib/app-api";

export const dynamic = "force-dynamic";

const STATUSES = ["taslak", "onayda", "yayinda", "arsiv"] as const;

export const GET = appRoute(async (req) => {
  const sp = new URL(req.url).searchParams;
  const s = sp.get("status");
  const status = STATUSES.find((x) => x === s) ?? "onayda";
  const d = await db();
  return { products: await loadProducts(d, origin(req), { status, limit: Math.min(200, Number(sp.get("limit")) || 100) }) };
});
