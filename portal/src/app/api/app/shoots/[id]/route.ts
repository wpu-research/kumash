import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobs, shoots } from "@/db/schema";
import { abs, ApiError, appRoute, intParam, loadProducts, origin } from "@/lib/app-api";

export const dynamic = "force-dynamic";

export const GET = appRoute<{ id: string }>(async (req, { id }) => {
  const shootId = intParam(id);
  const d = await db();
  const base = origin(req);
  const [s] = await d.select().from(shoots).where(eq(shoots.id, shootId));
  if (!s) throw new ApiError(404, "Çekim bulunamadı");
  const [job] = await d
    .select()
    .from(jobs)
    .where(sql`${jobs.type} = 'process_shoot' and (${jobs.payload}->>'shootId')::int = ${shootId}`)
    .orderBy(desc(jobs.id))
    .limit(1);
  return {
    shoot: { id: s.id, status: s.status, note: s.note, createdAt: s.createdAt, photos: s.photoUrls.map((u) => abs(base, u)) },
    job: job ? { status: job.status, error: job.error, log: job.log, costCents: job.costCents } : null,
    products: await loadProducts(d, base, { shootId }),
  };
});
