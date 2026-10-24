import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { kick } from "@/lib/jobs";
import { logout } from "../actions";
import { PanelNav } from "./panel-nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  kick(); // sunucu yeniden başladıysa yarım kalan işleri devral
  const d = await db();
  const [{ n }] = await d.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(products).where(eq(products.status, "onayda"));
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_minmax(0,1fr)] bg-page">
      <aside className="bg-[#1A0910] text-white md:min-h-dvh md:sticky md:top-0 md:h-dvh flex md:flex-col">
        <Link href="/panel" className="px-5 py-4 md:py-6 font-display text-[28px] leading-none shrink-0">
          Kuma<i className="text-[#F6A6B9]">sh</i>
          <span className="hidden md:block font-sans text-[11px] tracking-[.18em] uppercase text-white/50 mt-2">Yönetim paneli</span>
        </Link>
        <PanelNav pending={n} />
        <div className="hidden md:grid gap-1 mt-auto p-3 text-[13px] text-white/60">
          <Link href="/" className="px-3 py-2 rounded-lg hover:bg-white/10">Mağazaya git ↗</Link>
          <form action={logout}><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">Çıkış yap</button></form>
        </div>
      </aside>
      <div className="min-w-0 px-4 md:px-8 py-6 md:py-8">{children}</div>
    </div>
  );
}
