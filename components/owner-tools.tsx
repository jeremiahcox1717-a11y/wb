"use client";

import { useState } from "react";
import { ProjectList, type ProjectCard } from "@/components/project-list";
import { SiteBuilderBot } from "@/components/site-builder-bot";
import { UrlDesk } from "@/components/url-desk";

export function OwnerTools({
  onProject,
  latestProject,
}: {
  onProject: (project: ProjectCard) => void;
  latestProject?: ProjectCard | null;
}) {
  const [tab, setTab] = useState<"build" | "sites" | "urls">("build");

  return (
    <aside
      id="owner-tools"
      className="flex h-[30vh] w-full shrink-0 flex-col border-t border-[#2a2a32] bg-[#0e0e12] text-[#f3eee8] md:sticky md:top-2 md:h-[28rem] md:w-[32rem] md:self-start md:border-t-0 md:border-l"
    >
      <div className="flex border-b border-[#2a2a32]">
        <button
          type="button"
          id="tab-builder"
          onClick={() => setTab("build")}
          className={`flex-1 px-3 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase ${
            tab === "build" ? "bg-[#16161c] text-[#d4a574]" : "text-[#7d7368]"
          }`}
        >
          Builder
        </button>
        <button
          type="button"
          id="tab-sites"
          onClick={() => setTab("sites")}
          className={`flex-1 px-3 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase ${
            tab === "sites" ? "bg-[#16161c] text-[#d4a574]" : "text-[#7d7368]"
          }`}
        >
          Sites
        </button>
        <button
          type="button"
          id="tab-urls"
          onClick={() => setTab("urls")}
          className={`flex-1 px-3 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase ${
            tab === "urls" ? "bg-[#16161c] text-[#d4a574]" : "text-[#7d7368]"
          }`}
        >
          URLs
        </button>
      </div>
      {tab === "build" ? (
        <SiteBuilderBot
          onProject={(project) => {
            onProject(project);
            setTab("sites");
          }}
        />
      ) : null}
      {tab === "sites" ? <ProjectList latest={latestProject} /> : null}
      {tab === "urls" ? <UrlDesk /> : null}
    </aside>
  );
}
