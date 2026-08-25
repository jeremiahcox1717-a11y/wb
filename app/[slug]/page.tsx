import { notFound } from "next/navigation";
import { PrivateSiteShell } from "@/components/private-site-shell";
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
  return <PrivateSiteShell initialSite={site} pageSlug={`/${slug}`} />;
}
