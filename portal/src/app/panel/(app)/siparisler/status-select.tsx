"use client";

const LABELS = { alindi: "Alındı", hazirlaniyor: "Hazırlanıyor", kargoda: "Kargoda", teslim: "Teslim edildi", iptal: "İptal" } as const;

export function StatusSelect({ id, value }: { id: string; value: string }) {
  return (
    <select
      id={id}
      name="status"
      defaultValue={value}
      aria-label="Sipariş durumu"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="h-9 rounded-lg border border-line bg-white px-2 text-[13px]"
    >
      {Object.entries(LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}
