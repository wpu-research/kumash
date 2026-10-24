import Link from "next/link";
import { colorFacets, listProducts, SORTS, type ListFilter, type SortKey } from "@/lib/catalog";
import { SIZES, type Gender } from "@/lib/catalog-data";
import { ProductGrid } from "./product-card";
import { SortSelect } from "./sort-select";

export type SP = Record<string, string | string[] | undefined>;
const arr = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parseFilter(sp: SP): ListFilter {
  const sort = String(sp.sirala ?? "onerilen") as SortKey;
  return {
    colors: arr(sp.renk),
    sizes: arr(sp.beden),
    min: num(sp.min),
    max: num(sp.max),
    sort: sort in SORTS ? sort : "onerilen",
    page: num(sp.sayfa) ?? 1,
  };
}

export async function Listing({
  title,
  crumbs,
  basePath,
  sp,
  fixed,
  intro,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
  basePath: string;
  sp: SP;
  fixed: Pick<ListFilter, "gender" | "categorySlug" | "q" | "discounted">;
  intro?: React.ReactNode;
}) {
  const f = { ...parseFilter(sp), ...fixed };
  const [res, colors] = await Promise.all([listProducts(f), colorFacets(fixed.gender, fixed.categorySlug)]);
  const sizes = fixed.gender ? SIZES[fixed.gender as Gender] : [...new Set([...SIZES.kadin, ...SIZES.erkek])];
  const keep = (extra: Record<string, string | number>) => {
    const q = new URLSearchParams();
    if (fixed.q) q.set("q", fixed.q);
    f.colors?.forEach((c) => q.append("renk", c));
    f.sizes?.forEach((s) => q.append("beden", s));
    if (f.min) q.set("min", String(f.min));
    if (f.max) q.set("max", String(f.max));
    if (f.sort && f.sort !== "onerilen") q.set("sirala", f.sort);
    for (const [k, v] of Object.entries(extra)) q.set(k, String(v));
    return `${basePath}?${q.toString()}`;
  };
  const active = (f.colors?.length ?? 0) + (f.sizes?.length ?? 0) + (f.min ? 1 : 0) + (f.max ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6">
      <nav className="text-[12px] text-muted flex flex-wrap gap-1.5" aria-label="Konum">
        <Link href="/" className="hover:text-brand">Kumash</Link>
        {crumbs.map((c) => (
          <span key={c.label} className="flex gap-1.5">
            <span>/</span>
            {c.href ? <Link href={c.href} className="hover:text-brand">{c.label}</Link> : <span className="text-ink">{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold">{title}</h1>
          <p className="text-[13px] text-muted mt-0.5">{res.total} ürün listeleniyor</p>
        </div>
        <SortSelect value={f.sort ?? "onerilen"} />
      </div>
      {intro}
      <div className="mt-5 grid gap-6 md:grid-cols-[230px_minmax(0,1fr)]">
        <form action={basePath} className="bg-white rounded-lg border border-line p-4 h-max md:sticky md:top-[150px] text-[14px] grid gap-5">
          {fixed.q && <input type="hidden" name="q" value={fixed.q} />}
          {f.sort && f.sort !== "onerilen" && <input type="hidden" name="sirala" value={f.sort} />}
          <fieldset>
            <legend className="font-semibold mb-2">Renk</legend>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 max-h-56 overflow-auto pr-1">
              {colors.map((c) => (
                <label key={c.color} className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input type="checkbox" name="renk" value={c.color} defaultChecked={f.colors?.includes(c.color)} className="accent-brand" />
                  <span className="size-3 rounded-full border border-black/15" style={{ background: c.hex }} />
                  <span className="truncate">{c.color}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold mb-2">Beden</legend>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="checkbox" name="beden" value={s} defaultChecked={f.sizes?.includes(s)} className="peer sr-only" />
                  <span className="block min-w-10 text-center px-2 py-1.5 rounded border border-line text-[13px] peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand">{s}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold mb-2">Fiyat (TL)</legend>
            <div className="flex items-center gap-2">
              <input name="min" id="min" inputMode="numeric" placeholder="En az" defaultValue={f.min} className="w-full h-9 rounded border border-line px-2 text-[13px]" />
              <span className="text-muted">–</span>
              <input name="max" id="max" inputMode="numeric" placeholder="En çok" defaultValue={f.max} className="w-full h-9 rounded border border-line px-2 text-[13px]" />
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button className="flex-1 h-10 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark">Uygula</button>
            {active > 0 && (
              <Link href={fixed.q ? `${basePath}?q=${encodeURIComponent(fixed.q)}` : basePath} className="h-10 px-3 rounded-lg border border-line grid place-items-center text-[13px]">Temizle</Link>
            )}
          </div>
        </form>
        <div className="min-w-0">
          {res.items.length ? (
            <ProductGrid items={res.items} />
          ) : (
            <div className="bg-white rounded-lg border border-line p-10 text-center">
              <p className="font-semibold">Bu filtrelerle ürün bulunamadı.</p>
              <p className="text-muted text-[14px] mt-1">Filtreleri azaltmayı ya da farklı bir arama yapmayı deneyin.</p>
            </div>
          )}
          {res.pages > 1 && (
            <nav className="mt-8 flex justify-center gap-1.5" aria-label="Sayfalar">
              {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={keep({ sayfa: n })}
                  aria-current={n === res.page ? "page" : undefined}
                  className={`size-10 grid place-items-center rounded-lg border text-[14px] ${n === res.page ? "bg-brand border-brand text-white" : "bg-white border-line hover:border-brand"}`}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
