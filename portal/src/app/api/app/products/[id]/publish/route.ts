import { z } from "zod";
import { ApiError, appRoute, getOne, intParam } from "@/lib/app-api";
import { enqueue } from "@/lib/jobs";
import { CHANNELS } from "@/lib/publishers";

export const dynamic = "force-dynamic";

const Body = z.object({ channels: z.array(z.enum(CHANNELS)).min(1).default([...CHANNELS]) });

// Onayla ve yayınla: ürün "yayinda" olur, seçilen kanallara yayın işi kuyruğa girer.
export const POST = appRoute<{ id: string }>(async (req, { id }) => {
  const productId = intParam(id);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError(400, "Geçersiz kanal listesi");
  const p = await getOne(req, productId);
  if (!p.variants.some((v) => v.stock > 0)) throw new ApiError(400, "Yayından önce en az bir bedene stok girin");
  const channels = parsed.data.channels.includes("site") ? parsed.data.channels : ["site" as const, ...parsed.data.channels];
  const job = await enqueue("publish_product", { productId, channels });
  return { ok: true, jobId: job.id, channels };
});
