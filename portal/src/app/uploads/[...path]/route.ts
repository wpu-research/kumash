import { readFile } from "node:fs/promises";
import path from "node:path";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".heic": "image/heic" };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const file = path.resolve(root, ...(await params).path);
  if (!file.startsWith(root + path.sep)) return new Response("Bulunamadı", { status: 404 });
  try {
    const buf = await readFile(file);
    return new Response(new Uint8Array(buf), { headers: { "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "private, max-age=86400" } });
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
}
