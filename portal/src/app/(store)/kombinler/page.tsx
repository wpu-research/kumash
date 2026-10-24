import { getOutfits } from "@/lib/catalog";
import { OutfitCard } from "@/components/outfit-card";

export const metadata = { title: "Kombinler" };

export default async function Page() {
  const outs = await getOutfits(40);
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6">
      <h1 className="text-[22px] font-semibold">Kombinler</h1>
      <p className="text-[13px] text-muted mt-0.5">AI mankende birlikte giydirdiğimiz parçalar. Parçaya dokunarak ürün sayfasına gidin.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outs.map((o) => <OutfitCard key={o.id} o={o} />)}
      </div>
    </div>
  );
}
