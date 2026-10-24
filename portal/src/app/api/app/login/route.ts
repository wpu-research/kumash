import { checkPassword, issueToken } from "@/lib/app-api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    // kaba kuvvet denemelerini yavaşlat
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ error: "Şifre yanlış." }, { status: 401 });
  }
  return Response.json(issueToken());
}
