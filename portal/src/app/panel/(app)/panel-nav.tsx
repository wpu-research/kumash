"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/panel", label: "Özet" },
  { href: "/panel/cekim", label: "Yeni çekim" },
  { href: "/panel/onay", label: "Onay bekleyenler", badge: true },
  { href: "/panel/urunler", label: "Ürünler" },
  { href: "/panel/siparisler", label: "Siparişler" },
  { href: "/panel/isler", label: "İş kayıtları" },
];

export function PanelNav({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav className="flex md:flex-col gap-1 px-2 md:px-3 overflow-x-auto text-[14px] items-center md:items-stretch">
      {ITEMS.map((i) => {
        const on = i.href === "/panel" ? path === "/panel" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`whitespace-nowrap flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${on ? "bg-white text-ink font-semibold" : "text-white/80 hover:bg-white/10"}`}>
            {i.label}
            {i.badge && pending > 0 && <span className="rounded-full bg-[#EBC548] text-[#2A210A] text-[11px] font-bold px-1.5 min-w-5 text-center">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
