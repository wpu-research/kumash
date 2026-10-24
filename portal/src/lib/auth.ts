import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "kms_admin";
const TTL = 60 * 60 * 12; // 12 saat

export function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET tanımlı değil");
  return s ?? "dev-secret";
}

export function adminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (!p && process.env.NODE_ENV === "production") return null; // üretimde şifresiz giriş yok
  return p ?? "kumash";
}

const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export async function startSession() {
  const exp = String(Math.floor(Date.now() / 1000) + TTL);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: TTL, secure: process.env.NODE_ENV === "production" });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/panel/giris");
}
