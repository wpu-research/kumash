export const LISTING_STYLE: Record<string, string> = {
  yayinda: "bg-ok/12 text-ok",
  kimlik_yok: "bg-warn/15 text-warn",
  bekliyor: "bg-page text-muted",
  hata: "bg-brand-soft text-brand",
  reddedildi: "bg-brand-soft text-brand",
};
export const LISTING_LABEL: Record<string, string> = { yayinda: "yayında", kimlik_yok: "kimlik yok", bekliyor: "bekliyor", hata: "hata", reddedildi: "reddedildi" };
export const CHANNEL_LABEL: Record<string, string> = { site: "Site", trendyol: "Trendyol", instagram: "Instagram", facebook: "Facebook" };

export const PRODUCT_STATUS: Record<string, [string, string]> = {
  taslak: ["Taslak", "bg-page text-muted"],
  onayda: ["Onayda", "bg-tape/30 text-tape-ink"],
  yayinda: ["Yayında", "bg-ok/12 text-ok"],
  arsiv: ["Arşiv", "bg-page text-muted"],
};

export const JOB_STATUS: Record<string, [string, string]> = {
  bekliyor: ["Sırada", "bg-page text-muted"],
  calisiyor: ["Çalışıyor", "bg-tape/30 text-tape-ink"],
  tamamlandi: ["Tamamlandı", "bg-ok/12 text-ok"],
  hata: ["Hata", "bg-brand-soft text-brand"],
};

export function Chip({ className, children, title }: { className: string; children: React.ReactNode; title?: string }) {
  return <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[24px] font-semibold">{title}</h1>
        {sub && <p className="text-[13.5px] text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export const fmtDate = (d: Date) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
