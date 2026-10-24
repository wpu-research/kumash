import { notFound } from "next/navigation";
import { Listing, type SP } from "@/components/listing";
import { getCategory } from "@/lib/catalog";

const G = { kadin: "Kadın", erkek: "Erkek" } as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCategory((await params).slug);
  return { title: c ? `${G[c.gender]} ${c.name}` : "Kategori" };
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) notFound();
  return (
    <Listing
      title={`${G[c.gender]} ${c.name}`}
      crumbs={[{ label: G[c.gender], href: `/${c.gender}` }, { label: c.name }]}
      basePath={`/kategori/${slug}`}
      sp={await searchParams}
      fixed={{ gender: c.gender, categorySlug: slug }}
    />
  );
}
