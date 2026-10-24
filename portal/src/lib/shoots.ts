import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shoots } from "@/db/schema";
import { enqueue } from "./jobs";

const OK_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);
export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

// Panel ve Atölye uygulaması aynı yolu kullanır: fotoğrafları diske yaz, çekimi kaydet, işlemeyi kuyruğa al.
export async function createShoot(files: File[], note: string) {
  const d = await db();
  const [shoot] = await d.insert(shoots).values({ note: note.trim() || null }).returning();
  const urls: string[] = [];
  if (files.length) {
    const dir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads", "shoots", String(shoot.id));
    await mkdir(dir, { recursive: true });
    for (const [i, f] of files.slice(0, MAX_PHOTOS).entries()) {
      // Telefon kamerasından gelen dosyalarda ad olmayabilir; uzantıyı türden çıkar
      const ext = path.extname(f.name).toLowerCase() || (f.type === "image/png" ? ".png" : ".jpg");
      if (!OK_EXT.has(ext) || f.size > MAX_PHOTO_BYTES) continue;
      const name = `${i + 1}${ext}`;
      await writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()));
      urls.push(`/uploads/shoots/${shoot.id}/${name}`);
    }
  }
  await d.update(shoots).set({ photoUrls: urls }).where(eq(shoots.id, shoot.id));
  const job = await enqueue("process_shoot", { shootId: shoot.id });
  return { ...shoot, photoUrls: urls, jobId: job.id };
}
