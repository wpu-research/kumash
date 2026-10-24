import { Listing, type SP } from "@/components/listing";

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").slice(0, 80);
  return <Listing title={q ? `"${q}" için sonuçlar` : "Tüm ürünler"} crumbs={[{ label: "Arama" }]} basePath="/ara" sp={sp} fixed={{ q: q || undefined }} />;
}
