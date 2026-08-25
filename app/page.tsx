import { SiteView } from "@/components/site-view";
import { readSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await readSite();
  const page = site.pages.find((item) => item.slug === "/") ?? site.pages[0];
  return <SiteView site={site} page={page} />;
}
