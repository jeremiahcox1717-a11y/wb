import { OwnerBar } from "@/components/owner-bar";
import { SiteView } from "@/components/site-view";
import { requireOwnerPage } from "@/lib/owner-gate";
import { readSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireOwnerPage("/");
  const site = await readSite();
  const page = site.pages.find((item) => item.slug === "/") ?? site.pages[0];
  return (
    <>
      <OwnerBar />
      <SiteView site={site} page={page} />
    </>
  );
}
