"use client";

import { useMemo, useState } from "react";
import { OwnerBar } from "@/components/owner-bar";
import { OwnerTools } from "@/components/owner-tools";
import type { ProjectCard } from "@/components/project-list";
import { SiteView } from "@/components/site-view";
import type { Site } from "@/lib/schema";

export function PrivateSiteShell({ initialSite, pageSlug }: { initialSite: Site; pageSlug: string }) {
  const [site] = useState(initialSite);
  const [latestProject, setLatestProject] = useState<ProjectCard | null>(null);
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
      <OwnerBar latestProject={latestProject} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-[70vh] min-w-0 flex-1 overflow-auto">
          <SiteView site={site} page={page} />
        </div>
        <OwnerTools latestProject={latestProject} onProject={setLatestProject} />
      </div>
    </div>
  );
}
