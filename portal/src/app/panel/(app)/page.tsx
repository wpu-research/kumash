import Link from "next/link";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { channelListings, jobs, orders, products, variants } from "@/db/schema";
import { tl } from "@/lib/catalog-data";
import { CHANNEL_LABEL, Chip, JOB_STATUS, LISTING_LABEL, LISTING_STYLE, PageTitle, fmtDate } from "@/components/admin-ui";

export const metadata = { title: "Panel" };

export default async function Page() {
  const d = await db();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = sql<number>`count(*)`.mapWith(Number);
  const [statusRows, [ordersToday], [outOfStock], listingRows, recentJobs] = await Promise.all([
    d.select({ status: products.status, n: count }).from(products).groupBy(products.status),
    d.select({ n: count, sum: sql<number>`coalesce(sum(${orders.total}),0)`.mapWith(Number) }).from(orders).where(gte(orders.createdAt, today)),
    d.select({ n: count }).from(variants).innerJoin(products, eq(products.id, variants.productId)).where(sql`${variants.stock} = 0 and ${products.status} = 'yayinda'`),
    d.select({ channel: channelListings.channel, status: channelListings.status, n: count }).from(channelListings).innerJoin(products, eq(products.id, channelListings.productId)).where(eq(products.status, "yayinda")).groupBy(channelListings.channel, channelListings.status),
    d.select().from(jobs).orderBy(desc(jobs.id)).limit(6),
  ]);
  const by = (s: string) => statusRows.find((r) => r.status === s)?.n ?? 0;
  const tiles = [
    { k: "Yayında ürün", v: String(by("yayinda")), href: "/panel/urunler" },
    { k: "Onay bekleyen", v: String(by("onayda")), href: "/panel/onay", hot: by("onayda") > 0 },
    { k: "Bugünkü sipariş", v: `${ordersToday.n} · ${tl(ordersToday.sum)}`, href: "/panel/siparisler" },
    { k: "Stoğu biten beden", v: String(outOfStock.n), href: "/panel/urunler" },
  ];

  return (
    <>
      <PageTitle
        title="Özet"
        sub="Çekimden yayına tüm hat tek ekranda"
        action={<Link href="/panel/cekim" className="h-11 px-5 rounded-lg bg-brand text-white font-semibold grid place-items-center hover:bg-brand-dark">+ Yeni çekim yükle</Link>}
      />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.k} href={t.href} className={`rounded-xl border p-5 bg-white hover:shadow-md transition-shadow ${t.hot ? "border-tape ring-2 ring-tape/40" : "border-line"}`}>
            <div className="text-[13px] text-muted">{t.k}</div>
            <div className="mt-2 text-[26px] font-semibold tabular-nums leading-none">{t.v}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="bg-white rounded-xl border border-line p-5">
          <h2 className="font-semibold">Kanal durumu</h2>
          <p className="text-[12.5px] text-muted">Yayındaki ürünlerin kanallardaki karşılığı</p>
          <div className="mt-4 grid gap-4">
            {(["site", "trendyol", "instagram"] as const).map((ch) => {
              const rows = listingRows.filter((r) => r.channel === ch);
              const total = rows.reduce((s, r) => s + r.n, 0) || 1;
              return (
                <div key={ch}>
                  <div className="flex justify-between text-[14px]">
                    <b className="font-semibold">{CHANNEL_LABEL[ch]}</b>
                    <span className="flex gap-1.5">{rows.map((r) => <Chip key={r.status} className={LISTING_STYLE[r.status]}>{r.n} {LISTING_LABEL[r.status]}</Chip>)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-page flex overflow-hidden">
                    {rows.map((r) => (
                      <div key={r.status} style={{ width: `${(r.n / total) * 100}%` }} className={r.status === "yayinda" ? "bg-ok" : r.status === "kimlik_yok" ? "bg-warn" : r.status === "hata" ? "bg-brand" : "bg-line"} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[12.5px] text-muted leading-relaxed">Trendyol ve Instagram için API kimlik bilgileri girildiğinde ürünler otomatik gönderilir (<code className="font-mono">TRENDYOL_*</code>, <code className="font-mono">INSTAGRAM_*</code>).</p>
        </section>

        <section className="bg-white rounded-xl border border-line p-5">
          <div className="flex justify-between items-baseline">
            <h2 className="font-semibold">Son işler</h2>
            <Link href="/panel/isler" className="text-[13px] text-brand font-semibold">Tümü</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {recentJobs.length === 0 && <li className="py-6 text-center text-muted text-[14px]">Henüz iş yok. İlk çekimi yükleyerek başlayın.</li>}
            {recentJobs.map((j) => (
              <li key={j.id} className="py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium">
                    {j.type === "process_shoot" ? <Link href={`/panel/cekim/${String(j.payload.shootId)}`} className="hover:text-brand">Çekim #{String(j.payload.shootId)} işleme</Link> : j.type === "publish_product" ? `Ürün #${String(j.payload.productId)} yayın` : "Stok senkronu"}
                  </div>
                  <div className="text-[12.5px] text-muted truncate">{j.log.at(-1)?.msg ?? "—"}</div>
                </div>
                <div className="text-right">
                  <Chip className={JOB_STATUS[j.status][1]}>{JOB_STATUS[j.status][0]}</Chip>
                  <div className="text-[11.5px] text-muted mt-1">{fmtDate(j.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
