import { desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, shoots } from "@/db/schema";
import { abs, ApiError, appRoute, origin } from "@/lib/app-api";
import { createShoot, MAX_PHOTOS } from "@/lib/shoots";

export const dynamic = "force-dynamic";

export const GET = appRoute(async (req) => {
  const d = await db();
  const base = origin(req);
  const rows = await d.select().from(shoots).orderBy(desc(shoots.id)).limit(40);
  const counts = rows.length
    ? await d
        .select({ shootId: products.shootId, n: sql<number>`count(*)::int` })
        .from(products)
        .where(inArray(products.shootId, rows.map((r) => r.id)))
        .groupBy(products.shootId)
    : [];
  return {
    shoots: rows.map((s) => ({
      id: s.id,
      status: s.status,
      note: s.note,
      createdAt: s.createdAt,
      photos: s.photoUrls.map((u) => abs(base, u)),
      products: counts.find((c) => c.shootId === s.id)?.n ?? 0,
    })),
  };
});

export const POST = appRoute(async (req) => {
  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError(400, "Fotoğraflar okunamadı");
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) throw new ApiError(400, "En az bir fotoğraf gerekli");
  if (files.length > MAX_PHOTOS) throw new ApiError(400, `En fazla ${MAX_PHOTOS} fotoğraf yüklenebilir`);
  const shoot = await createShoot(files, String(form.get("note") ?? ""));
  if (!shoot.photoUrls.length) throw new ApiError(400, "Fotoğraflar desteklenmeyen biçimde ya da 15 MB'tan büyük");
  return Response.json({ id: shoot.id }, { status: 201 });
});
