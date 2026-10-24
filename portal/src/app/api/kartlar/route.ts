import { getProductsByIds } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 100);
  return Response.json(await getProductsByIds(ids));
}
