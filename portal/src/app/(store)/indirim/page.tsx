import { Listing, type SP } from "@/components/listing";

export const metadata = { title: "İndirimdeki Ürünler" };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="İndirimdeki ürünler" crumbs={[{ label: "İndirim" }]} basePath="/indirim" sp={await searchParams} fixed={{ discounted: true }} />;
}
