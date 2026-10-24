import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { getCategories } from "@/lib/catalog";
import { BagIcon, ChevronIcon, HeartIcon, SearchIcon, UserIcon } from "./icons";

export async function Header() {
  const [count, cats] = await Promise.all([cartCount(), getCategories()]);
  const kadin = cats.filter((c) => c.gender === "kadin");
  const erkek = cats.filter((c) => c.gender === "erkek");
  return (
    <header className="bg-white border-b border-line sticky top-0 z-40">
      <div className="tape text-[12px] font-medium">
        <div className="mx-auto max-w-[1240px] px-4 pt-[10px] pb-[5px] flex justify-center gap-6 whitespace-nowrap overflow-hidden">
          <span>500 TL üzeri kargo bedava</span>
          <span className="hidden sm:inline">14 gün içinde ücretsiz iade</span>
          <span className="hidden md:inline">Aynı gün kargo: 14:00'e kadar verilen siparişler</span>
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-4 h-[72px] flex items-center gap-4 md:gap-8">
        <Link href="/" className="font-display text-[34px] leading-none tracking-tight text-ink shrink-0" aria-label="Kumash ana sayfa">
          Kuma<i className="text-brand">sh</i>
        </Link>
        <form action="/ara" className="flex-1 min-w-0">
          <label className="relative block">
            <span className="sr-only">Ürün ara</span>
            <input
              id="q"
              name="q"
              placeholder="Aradığınız ürün, renk veya kumaş"
              className="w-full h-11 rounded-lg bg-page border border-transparent focus:border-brand focus:bg-white outline-none pl-4 pr-11 text-[15px] placeholder:text-muted"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand" aria-label="Ara"><SearchIcon /></button>
          </label>
        </form>
        <nav className="flex items-center gap-1 sm:gap-4 text-[13px] shrink-0">
          <Link href="/panel" className="hidden md:flex items-center gap-1.5 hover:text-brand"><UserIcon className="size-5" /> Panel</Link>
          <Link href="/favoriler" className="flex items-center gap-1.5 hover:text-brand p-2 sm:p-0"><HeartIcon className="size-5" /><span className="hidden sm:inline">Favorilerim</span></Link>
          <Link href="/sepet" className="flex items-center gap-1.5 hover:text-brand p-2 sm:p-0 relative">
            <BagIcon className="size-5" />
            <span className="hidden sm:inline">Sepetim</span>
            {count > 0 && (
              <span className="absolute -top-1 left-3 sm:static min-w-5 h-5 px-1 rounded-full bg-brand text-white text-[11px] font-semibold grid place-items-center">{count}</span>
            )}
          </Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <nav className="mx-auto max-w-[1240px] px-4 h-11 flex items-center gap-6 text-[14px] font-medium scroll-x">
          {[
            { label: "Kadın", href: "/kadin", items: kadin },
            { label: "Erkek", href: "/erkek", items: erkek },
          ].map((g) => (
            <div key={g.label} className="group relative h-full flex items-center">
              <Link href={g.href} className="flex items-center gap-1 hover:text-brand">
                {g.label} <ChevronIcon className="size-3.5" />
              </Link>
              <div className="hidden md:group-hover:block md:group-focus-within:block absolute left-0 top-full pt-0 z-50">
                <div className="bg-white border border-line rounded-b-lg shadow-xl p-5 grid grid-cols-2 gap-x-10 gap-y-2 w-[360px]">
                  <Link href={g.href} className="col-span-2 font-semibold text-brand mb-1">Tüm {g.label} Giyim</Link>
                  {g.items.map((c) => (
                    <Link key={c.id} href={`/kategori/${c.slug}`} className="text-ink/80 hover:text-brand font-normal">{c.name}</Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {kadin.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/kategori/${c.slug}`} className="hidden lg:block hover:text-brand whitespace-nowrap">{c.name}</Link>
          ))}
          <Link href="/kombinler" className="hover:text-brand whitespace-nowrap">Kombinler</Link>
          <Link href="/indirim" className="text-brand whitespace-nowrap">İndirim</Link>
          <Link href="/yeni" className="hover:text-brand whitespace-nowrap">Yeni Gelenler</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-white border-t border-line">
      <div className="mx-auto max-w-[1240px] px-4 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-[14px]">
        <div>
          <div className="font-display text-[30px] leading-none">Kuma<i className="text-brand">sh</i></div>
          <p className="mt-3 text-muted max-w-[32ch]">Kendi tasarladığımız kadın ve erkek giyim. Her ürünü manken üzerinde ve gerçek fotoğrafıyla gösteriyoruz.</p>
        </div>
        <div className="grid gap-2">
          <b className="font-semibold">Alışveriş</b>
          <Link href="/kadin" className="text-muted hover:text-brand">Kadın</Link>
          <Link href="/erkek" className="text-muted hover:text-brand">Erkek</Link>
          <Link href="/kombinler" className="text-muted hover:text-brand">Kombinler</Link>
          <Link href="/indirim" className="text-muted hover:text-brand">İndirim</Link>
        </div>
        <div className="grid gap-2 content-start">
          <b className="font-semibold">Yardım</b>
          <span className="text-muted">Kargo ve teslimat</span>
          <span className="text-muted">İade ve değişim (14 gün)</span>
          <span className="text-muted">Beden rehberi</span>
        </div>
        <div className="grid gap-2 content-start">
          <b className="font-semibold">Bizi takip edin</b>
          <span className="text-muted">Instagram · TikTok · Trendyol mağazamız</span>
          <p className="text-[12px] text-muted mt-2">Bu bir demo katalogdur: ürün fotoğrafları Openverse üzerinden CC lisanslı görsellerdir, fotoğrafçı atıfları ürün sayfalarındadır.</p>
        </div>
      </div>
      <div className="border-t border-line text-[12px] text-muted">
        <div className="mx-auto max-w-[1240px] px-4 py-4 flex flex-wrap gap-x-6 gap-y-1 justify-between">
          <span>© 2026 Kumash</span>
          <span>Mesafeli Satış Sözleşmesi · KVKK Aydınlatma Metni · Çerez Politikası</span>
        </div>
      </div>
    </footer>
  );
}
