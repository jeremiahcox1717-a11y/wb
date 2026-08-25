"use client";

import { useState } from "react";
import { SiteBuilderBot } from "@/components/site-builder-bot";
import { UrlDesk } from "@/components/url-desk";
import type { Site } from "@/lib/schema";

export function OwnerTools({ onSite }: { onSite: (site: Site) => void }) {
  const [tab, setTab] = useState<"build" | "urls">("build");

  return (
    <aside
      id="owner-tools"
      className="flex h-[46vh] w-full shrink-0 flex-col border-t border-[#2a2a32] bg-[#0e0e12] text-[#f3eee8] md:h-auto md:w-[26rem] md:border-t-0 md:border-l"
    >
      <div className="flex border-b border-[#2a2a32]">
        <button
          type="button"
          id="tab-builder"
          onClick={() => setTab("build")}
          className={`flex-1 px-3 py-3 text-xs font-semibold tracking-[0.18em] uppercase ${
            tab === "build" ? "bg-[#16161c] text-[#d4a574]" : "text-[#7d7368]"
          }`}
        >
          Builder
        </button>
        <button
          type="button"
          id="tab-urls"
          onClick={() => setTab("urls")}
          className={`flex-1 px-3 py-3 text-xs font-semibold tracking-[0.18em] uppercase ${
            tab === "urls" ? "bg-[#16161c] text-[#d4a574]" : "text-[#7d7368]"
          }`}
        >
          URL check
        </button>
      </div>
      {tab === "build" ? <SiteBuilderBot onSite={onSite} /> : <UrlDesk />}
    </aside>
  );
}
