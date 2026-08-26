"use client";

import Link from "next/link";
import type { ProjectCard } from "@/components/project-list";

export function OwnerBar({ latestProject }: { latestProject?: ProjectCard | null }) {
  async function lock() {
    await fetch("/api/auth/logout", { method: "POST" });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/studio/login");
  }

  return (
    <div className="flex flex-col gap-2 bg-[#111114] px-4 py-2 text-xs text-[#b9a89a] md:flex-row md:items-center md:justify-between">
      <p>Private desk — only you. The builder makes new websites for other people. This homepage stays Jordan Bennett.</p>
      <div className="flex flex-wrap items-center gap-3">
        {latestProject ? (
          <a id="latest-client-site" href={latestProject.url} className="text-[#d4a574] underline">
            Open {latestProject.name}
          </a>
        ) : null}
        <Link href="/studio" className="underline">
          Studio
        </Link>
        <button type="button" onClick={() => void lock()} className="underline">
          Lock
        </button>
      </div>
    </div>
  );
}
