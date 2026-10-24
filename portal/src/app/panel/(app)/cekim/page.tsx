import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { shoots } from "@/db/schema";
import { PageTitle, fmtDate } from "@/components/admin-ui";
import { uploadShoot } from "../../actions";
import { PhotoPicker } from "./photo-picker";
import { getProvider } from "@/lib/pipeline";

export const metadata = { title: "Yeni çekim" };

const SHOOT_LABEL = { yuklendi: "Yüklendi", isleniyor: "İşleniyor", tamamlandi: "Tamamlandı", hata: "Hata" } as const;

export default async function Page() {
  const d = await db();
  const recent = await d.select().from(shoots).orderBy(desc(shoots.id)).limit(8);
  const provider = getProvider();
  return (
    <>
      <PageTitle title="Yeni çekim" sub="Ürünleri düz zemine serip tek fotoğraf çekin; AI parçaları ayırır, mankene giydirir, metinleri yazar." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <form action={uploadShoot} className="bg-white rounded-xl border border-line p-5 grid gap-5">
          <PhotoPicker />
          <label htmlFor="note" className="grid gap-1.5 text-[13px] font-medium">
            Not (isteğe bağlı)
            <input id="note" name="note" placeholder="Örn. Sonbahar kadın — 3 parça" className="h-11 rounded-lg border border-line px-3 text-[14px] font-normal outline-none focus:border-brand" />
          </label>
          <button className="h-12 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark">Yükle ve işle</button>
          <p className="text-[12.5px] text-muted -mt-2">
            AI sağlayıcısı: <b>{provider.name}</b>.{" "}
            {provider.name === "mock" ? "Fotoğrafa bakmadan örnek parçalar üretir; Claude için ANTHROPIC_API_KEY tanımlayın." : "Fotoğraftaki parçaları bulur, özelliklerini okur ve metni yazar. Fotoğrafsız deneme mock ile işlenir."}
          </p>
        </form>
        <aside className="grid gap-4 content-start">
          <div className="bg-white rounded-xl border border-line p-5">
            <h2 className="font-semibold">İyi bir çekim için</h2>
            <ul className="mt-3 grid gap-2 text-[13.5px] text-ink/80 list-disc pl-5">
              <li>Düz, açık renk zemin; gün ışığı lambası</li>
              <li>Ürünler üst üste binmeden, arada boşlukla</li>
              <li>Telefon yere paralel, sabit açı</li>
              <li>Desen ve etiket için ayrıca yakın çekim</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-line p-5">
            <h2 className="font-semibold">Son çekimler</h2>
            <ul className="mt-2 divide-y divide-line text-[14px]">
              {recent.length === 0 && <li className="py-3 text-muted">Henüz çekim yok.</li>}
              {recent.map((s) => (
                <li key={s.id} className="py-2.5 flex justify-between gap-3">
                  <Link href={`/panel/cekim/${s.id}`} className="hover:text-brand truncate">#{s.id} {s.note ?? ""}</Link>
                  <span className="text-muted text-[12.5px] whitespace-nowrap">{SHOOT_LABEL[s.status]} · {fmtDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
