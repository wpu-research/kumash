import { Listing, type SP } from "@/components/listing";

export const metadata = { title: "Yeni Gelenler" };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return <Listing title="Yeni gelenler" crumbs={[{ label: "Yeni Gelenler" }]} basePath="/yeni" sp={{ sirala: "yeni", ...sp }} fixed={{}} />;
}
