"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// İş sürerken sayfayı 1,2 sn'de bir tazeler; bitince durur.
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 1200);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
