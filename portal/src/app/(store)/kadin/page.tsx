import { Listing, type SP } from "@/components/listing";

export const metadata = { title: "Kadın Giyim" };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="Kadın Giyim" crumbs={[{ label: "Kadın" }]} basePath="/kadin" sp={await searchParams} fixed={{ gender: "kadin" }} />;
}
