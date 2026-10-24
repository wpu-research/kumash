"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS } from "@/lib/catalog-data";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-muted">Sırala</span>
      <select
        id="sirala"
        value={value}
        onChange={(e) => {
          const q = new URLSearchParams(sp.toString());
          q.delete("sayfa");
          if (e.target.value === "onerilen") q.delete("sirala");
          else q.set("sirala", e.target.value);
          router.push(`${path}?${q.toString()}`);
        }}
        className="h-9 rounded-lg border border-line bg-white px-2 text-[13px]"
      >
        {Object.entries(SORTS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </label>
  );
}
