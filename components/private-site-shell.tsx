"use client";

import { useMemo, useState } from "react";
import { OwnerBar } from "@/components/owner-bar";
import { OwnerTools } from "@/components/owner-tools";
import { SiteView } from "@/components/site-view";
import type { Site } from "@/lib/schema";

export function PrivateSiteShell({ initialSite, pageSlug }: { initialSite: Site; pageSlug: string }) {
  const [site, setSite] = useState(initialSite);
  const page = useMemo(() => {
    return (
      site.pages.find((item) => item.slug === pageSlug) ??
      site.pages.find((item) => item.slug === "/") ??
      site.pages[0]
    );
  }, [pageSlug, site]);

  if (!page) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#111114]">
      <OwnerBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-[54vh] min-w-0 flex-1 overflow-auto">
          <SiteView site={site} page={page} />
        </div>
        <OwnerTools onSite={setSite} />
      </div>
    </div>
  );
}
