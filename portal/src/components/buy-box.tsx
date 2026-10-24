"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions";
import { CheckIcon } from "./icons";

type V = { id: number; size: string; stock: number };

export function BuyBox({ variants }: { variants: V[] }) {
  const firstInStock = variants.find((v) => v.stock > 0);
  const [sel, setSel] = useState<number | null>(variants.length === 1 ? firstInStock?.id ?? null : null);
  const [err, setErr] = useState(false);
  const [added, setAdded] = useState(false);
  const [pending, start] = useTransition();
  const soldOut = !firstInStock;
  const selected = variants.find((v) => v.id === sel);

  function submit(then?: "sepet") {
    if (!sel) return setErr(true);
    const fd = new FormData();
    fd.set("variantId", String(sel));
    if (then) fd.set("then", then);
    start(async () => {
      await addToCart(fd);
      setAdded(true);
      setTimeout(() => setAdded(false), 2600);
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="flex justify-between items-baseline">
          <span className="text-[14px] font-semibold">Beden {selected && <span className="font-normal text-muted">· {selected.size}</span>}</span>
          <span className="text-[12px] text-brand">Beden tablosu</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Beden seç">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={sel === v.id}
              disabled={v.stock <= 0}
              onClick={() => {
                setSel(v.id);
                setErr(false);
              }}
              className={`relative min-w-14 h-11 px-3 rounded-lg border text-[14px] font-medium ${
                v.stock <= 0
                  ? "border-line text-muted/60 line-through cursor-not-allowed bg-page"
                  : sel === v.id
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-white hover:border-ink"
              }`}
            >
              {v.size}
              {v.stock > 0 && v.stock <= 3 && <span className="absolute -top-2 -right-2 rounded-full bg-warn text-white text-[10px] px-1.5 leading-4">son {v.stock}</span>}
            </button>
          ))}
        </div>
        {err && <p className="mt-2 text-[13px] text-brand">Lütfen bir beden seçin.</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={soldOut || pending}
          onClick={() => submit()}
          className="flex-1 h-12 rounded-lg bg-brand text-white font-semibold text-[15px] hover:bg-brand-dark disabled:opacity-50"
        >
          {soldOut ? "Tükendi" : pending ? "Ekleniyor…" : "Sepete Ekle"}
        </button>
        <button
          type="button"
          disabled={soldOut || pending}
          onClick={() => submit("sepet")}
          className="h-12 px-5 rounded-lg border-2 border-brand text-brand font-semibold text-[15px] hover:bg-brand-soft disabled:opacity-50"
        >
          Hemen Al
        </button>
      </div>
      <div aria-live="polite">
        {added && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-ok/10 text-ok px-3 py-2.5 text-[14px] font-medium">
            <span className="flex items-center gap-2"><CheckIcon /> Ürün sepetinize eklendi.</span>
            <Link href="/sepet" className="underline underline-offset-2">Sepete git</Link>
          </div>
        )}
      </div>
    </div>
  );
}
