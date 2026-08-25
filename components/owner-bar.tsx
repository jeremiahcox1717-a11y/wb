"use client";

import Link from "next/link";

export function OwnerBar() {
  async function lock() {
    await fetch("/api/auth/logout", { method: "POST" });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/studio/login");
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-[#111114] px-4 py-2 text-xs text-[#b9a89a]">
      <p>Private — only you can open this site</p>
      <div className="flex items-center gap-3">
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
