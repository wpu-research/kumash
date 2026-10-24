"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "./icons";

const KEY = "kms_favs";

export function readFavs(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function FavButton({ id, className = "", large = false }: { id: number; className?: string; large?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(readFavs().includes(id));
    const sync = () => setOn(readFavs().includes(id));
    window.addEventListener("kms-favs", sync);
    return () => window.removeEventListener("kms-favs", sync);
  }, [id]);
  function toggle() {
    const favs = readFavs();
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setOn(next.includes(id));
    window.dispatchEvent(new Event("kms-favs"));
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={`${className} grid place-items-center rounded-full bg-white shadow-sm border border-line ${large ? "size-12" : "size-9"} ${on ? "text-brand" : "text-ink/70 hover:text-brand"}`}
    >
      <HeartIcon className={large ? "size-6" : "size-[18px]"} filled={on} />
    </button>
  );
}
