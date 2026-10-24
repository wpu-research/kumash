import { GARMENTS, PATTERNS, renderGarmentSvg, type Garment, type Pattern, type View } from "@/lib/garments";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const g = (GARMENTS as readonly string[]).includes(q.get("g") ?? "") ? (q.get("g") as Garment) : "tisort";
  const pattern = (PATTERNS as readonly string[]).includes(q.get("p") ?? "") ? (q.get("p") as Pattern) : "duz";
  const color = /^[0-9a-fA-F]{6}$/.test(q.get("c") ?? "") ? `#${q.get("c")}` : "#888888";
  const sheen = Math.max(0, Math.min(1, Number(q.get("s") ?? 0.2) || 0));
  const v = q.get("v");
  const view: View = v === "manken" || v === "arka" ? v : "duz";
  return new Response(renderGarmentSvg({ g, color, pattern, sheen, view }), {
    headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=31536000, immutable" },
  });
}
