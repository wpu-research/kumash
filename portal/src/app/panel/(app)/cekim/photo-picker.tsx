"use client";

import { useState } from "react";

export function PhotoPicker() {
  const [previews, setPreviews] = useState<string[]>([]);
  return (
    <div className="grid gap-3">
      <label
        htmlFor="photos"
        className="relative grid place-items-center text-center rounded-xl border-2 border-dashed border-line hover:border-brand bg-page min-h-[220px] p-6 cursor-pointer"
      >
        <div>
          <div className="mx-auto size-14 rounded-full bg-brand-soft text-brand grid place-items-center text-[26px]">＋</div>
          <div className="mt-3 font-semibold">Fotoğraf çek ya da seç</div>
          <div className="text-[13px] text-muted mt-1">JPG, PNG, WEBP · en fazla 8 fotoğraf, her biri 15 MB</div>
          <div className="text-[12.5px] text-muted mt-1">Fotoğraf seçmeden de deneyebilirsiniz.</div>
        </div>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            previews.forEach((u) => URL.revokeObjectURL(u));
            setPreviews(Array.from(e.target.files ?? []).slice(0, 8).map((f) => URL.createObjectURL(f)));
          }}
        />
      </label>
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="Seçilen fotoğraf" className="aspect-square object-cover rounded-lg border border-line" />
          ))}
        </div>
      )}
    </div>
  );
}
