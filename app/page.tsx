import { PrivateSiteShell } from "@/components/private-site-shell";
import { requireOwnerPage } from "@/lib/owner-gate";
import { readSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireOwnerPage("/");
  const site = await readSite();
  return <PrivateSiteShell initialSite={site} pageSlug="/" />;
}
