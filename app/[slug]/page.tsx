import { notFound } from "next/navigation";
import { SiteView } from "@/components/site-view";
import { readSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PublicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "studio") notFound();
  const site = await readSite();
  const page = site.pages.find((item) => item.slug === `/${slug}`);
  if (!page) notFound();
  return <SiteView site={site} page={page} />;
}
