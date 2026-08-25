import { notFound } from "next/navigation";
import { OwnerBar } from "@/components/owner-bar";
import { SiteView } from "@/components/site-view";
import { requireOwnerPage } from "@/lib/owner-gate";
import { readSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PrivateSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "studio") notFound();
  await requireOwnerPage(`/${slug}`);
  const site = await readSite();
  const page = site.pages.find((item) => item.slug === `/${slug}`);
  if (!page) notFound();
  return (
    <>
      <OwnerBar />
      <SiteView site={site} page={page} />
    </>
  );
}
