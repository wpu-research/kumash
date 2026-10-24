"use client";

import { useState } from "react";
import { SparkIcon } from "./icons";

export type GalleryImage = { url: string; label: string; ai: boolean };

export function Gallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const [i, setI] = useState(0);
  const cur = images[i] ?? images[0];
  if (!cur) return null;
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[76px_minmax(0,1fr)] gap-3">
      <div className="flex flex-col gap-2">
        {images.map((im, n) => (
          <button
            key={im.url + n}
            type="button"
            onClick={() => setI(n)}
            aria-label={im.label}
            aria-current={n === i}
            className={`aspect-[3/4] rounded-md overflow-hidden border-2 bg-page ${n === i ? "border-brand" : "border-transparent hover:border-line"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-page border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.url} alt={`${alt} — ${cur.label}`} className="size-full object-cover" />
        <span className={`absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium backdrop-blur ${cur.ai ? "bg-ink/75 text-white" : "bg-white/90 text-ink"}`}>
          {cur.ai && <SparkIcon className="size-3.5" />}
          {cur.label}
        </span>
      </div>
    </div>
  );
}
