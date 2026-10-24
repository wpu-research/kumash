"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CardProduct } from "@/lib/catalog";
import { readFavs } from "@/components/fav-button";
import { ProductGrid } from "@/components/product-card";

export function Favorites() {
  const [items, setItems] = useState<CardProduct[] | null>(null);
  useEffect(() => {
    const load = () => {
      const ids = readFavs();
      if (!ids.length) return setItems([]);
      fetch(`/api/kartlar?ids=${ids.join(",")}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
    };
    load();
    window.addEventListener("kms-favs", load);
    return () => window.removeEventListener("kms-favs", load);
  }, []);
  if (items === null) return <p className="text-muted">Yükleniyor…</p>;
  if (!items.length)
    return (
      <div className="bg-white rounded-lg border border-line p-10 text-center">
        <p className="font-semibold">Henüz favori ürününüz yok.</p>
        <p className="text-muted text-[14px] mt-1">Ürün kartlarındaki kalbe dokunarak favorilere ekleyebilirsiniz.</p>
        <Link href="/" className="inline-block mt-4 px-5 h-10 leading-10 rounded-lg bg-brand text-white font-semibold">Alışverişe başla</Link>
      </div>
    );
  return <ProductGrid items={items} />;
}
