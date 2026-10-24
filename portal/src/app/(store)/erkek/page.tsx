import { Listing, type SP } from "@/components/listing";

export const metadata = { title: "Erkek Giyim" };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="Erkek Giyim" crumbs={[{ label: "Erkek" }]} basePath="/erkek" sp={await searchParams} fixed={{ gender: "erkek" }} />;
}
