import Link from "next/link";
import { getCategories, getOutfits, listProducts } from "@/lib/catalog";
import { garmentImageUrl, type Garment } from "@/lib/garments";
import { ProductCard } from "@/components/product-card";
import { stockFor } from "@/lib/stock";
import { OutfitCard } from "@/components/outfit-card";
import { ReturnIcon, SparkIcon, TruckIcon } from "@/components/icons";

function Row({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between">
        <h2 className="text-[20px] font-semibold">{title}</h2>
        <Link href={href} className="text-[13px] font-semibold text-brand">Tümünü gör</Link>
      </div>
      <div className="mt-4 scroll-x -mx-4 px-4">
        <div className="grid grid-flow-col auto-cols-[46%] sm:auto-cols-[31%] lg:auto-cols-[calc((100%-64px)/5)] gap-3 md:gap-4">{children}</div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [yeni, indirim, kadin, erkek, cats, outs] = await Promise.all([
    listProducts({ sort: "yeni", perPage: 10 }),
    listProducts({ discounted: true, perPage: 10 }),
    listProducts({ gender: "kadin", perPage: 3 }),
    listProducts({ gender: "erkek", perPage: 2 }),
    getCategories(),
    getOutfits(6),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-5">
      {/* kampanya alanı */}
      <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
        <Link href="/kadin" className="group relative overflow-hidden rounded-xl bg-[#2A0C14] text-white grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_80%_30%,rgba(210,56,95,.45),transparent_60%)]" />
          <div className="relative order-2 sm:order-1 self-end p-6 md:p-10">
            <div className="text-[11px] tracking-[.22em] uppercase text-[#E9CDA8]">Yeni sezon</div>
            <div className="font-display text-[44px] md:text-[52px] leading-[.95] mt-2">Kadın <i>koleksiyonu</i></div>
            <span className="inline-block mt-5 rounded-full bg-white text-ink px-5 py-2.5 text-[14px] font-semibold">Alışverişe başla</span>
          </div>
          <div className="relative order-1 sm:order-2 flex items-end justify-center gap-2 px-5 pt-6 sm:pt-10">
            {kadin.items.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.image}
                alt=""
                className={`w-1/3 aspect-[3/4] object-cover rounded-t-lg shadow-2xl transition-transform duration-500 ${i === 1 ? "z-10 scale-110 origin-bottom group-hover:-translate-y-1.5" : i === 0 ? "-rotate-3 origin-bottom-right opacity-90" : "rotate-3 origin-bottom-left opacity-90"}`}
              />
            ))}
          </div>
        </Link>
        <div className="grid gap-3">
          <Link href="/erkek" className="group relative overflow-hidden rounded-xl bg-[#1F2A44] text-white grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] min-h-[180px]">
            <div className="self-end p-6">
              <div className="font-display text-[36px] leading-none">Erkek</div>
              <div className="text-[13px] mt-2 opacity-80">Gömlek, ceket, mont</div>
            </div>
            <div className="flex items-end justify-center gap-2 pr-4 pt-4">
              {erkek.items.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.image} alt="" className="w-1/2 aspect-[3/4] object-cover rounded-t-lg shadow-xl transition-transform duration-500 group-hover:-translate-y-1" />
              ))}
            </div>
          </Link>
          <Link href="/indirim" className="tape relative overflow-hidden rounded-xl min-h-[180px] p-6 pt-8 grid content-end">
            <div className="text-[12px] font-semibold uppercase tracking-[.16em]">Sezon fırsatı</div>
            <div className="font-display text-[34px] md:text-[40px] leading-none mt-1">%40'a varan <i>indirim</i></div>
            <div className="text-[13px] mt-2">İndirimli ürünleri gör →</div>
          </Link>
        </div>
      </div>

      {/* kategori halkaları */}
      <section className="mt-8 scroll-x -mx-4 px-4">
        <div className="flex gap-4 md:gap-6">
          {cats.map((c) => (
            <Link key={c.id} href={`/kategori/${c.slug}`} className="shrink-0 w-[76px] text-center group">
              <span className="block size-[76px] rounded-full p-[3px] bg-[conic-gradient(var(--color-brand),var(--color-tape),var(--color-brand))]">
                <span className="block size-full rounded-full overflow-hidden bg-white border-2 border-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stockFor(c.slug)[0]?.file ?? garmentImageUrl({ g: c.garment as Garment, color: c.gender === "kadin" ? "#8E1236" : "#1F2A44", pattern: "duz", view: "duz" })} alt="" className={`size-full object-cover transition-transform ${stockFor(c.slug).length ? "object-top group-hover:scale-110" : "scale-125 group-hover:scale-[1.35]"}`} />
                </span>
              </span>
              <span className="block mt-1.5 text-[12px] leading-tight">{c.gender === "kadin" ? "Kadın" : "Erkek"}<br /><b className="font-semibold">{c.name}</b></span>
            </Link>
          ))}
        </div>
      </section>

      <Row title="Yeni gelenler" href="/yeni">
        {yeni.items.map((p) => <ProductCard key={p.id} p={p} />)}
      </Row>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[20px] font-semibold">Kombin önerileri</h2>
            <p className="text-[13px] text-muted">Tek çekimden çıkan parçaları birlikte giydirdik</p>
          </div>
          <Link href="/kombinler" className="text-[13px] font-semibold text-brand">Tümünü gör</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outs.slice(0, 3).map((o) => (
            <OutfitCard key={o.id} o={o} />
          ))}
        </div>
      </section>

      <Row title="İndirimdekiler" href="/indirim">
        {indirim.items.map((p) => <ProductCard key={p.id} p={p} />)}
      </Row>

      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          { icon: <SparkIcon className="size-6" />, t: "Manken üstünde gör", d: "Her ürün AI manken üzerinde ve düz çekim fotoğrafıyla." },
          { icon: <TruckIcon className="size-6" />, t: "Aynı gün kargo", d: "14:00'e kadar verilen siparişler aynı gün yolda." },
          { icon: <ReturnIcon className="size-6" />, t: "14 gün ücretsiz iade", d: "Olmadıysa kargo ücreti ödemeden iade edin." },
        ].map((x) => (
          <div key={x.t} className="bg-white rounded-xl border border-line p-5 flex gap-4">
            <span className="size-11 rounded-full bg-brand-soft text-brand grid place-items-center shrink-0">{x.icon}</span>
            <div>
              <b className="font-semibold">{x.t}</b>
              <p className="text-[13.5px] text-muted mt-0.5">{x.d}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
