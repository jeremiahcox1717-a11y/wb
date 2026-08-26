"use client";

import { useEffect, useState } from "react";

export type ProjectCard = {
  slug: string;
  name: string;
  clientName: string;
  source: string;
  url: string;
  updatedAt?: string;
};

export function ProjectList({
  latest,
  onSelect,
}: {
  latest?: ProjectCard | null;
  onSelect?: (slug: string) => void;
}) {
  const [remote, setRemote] = useState<ProjectCard[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/projects", { signal: ac.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          activeSlug?: string | null;
          projects?: ProjectCard[];
        };
        if (!response.ok) throw new Error(data.error || "Could not load sites.");
        return data;
      })
      .then((data) => {
        setRemote(data.projects || []);
        setActiveSlug(data.activeSlug ?? null);
        setError("");
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Could not load sites.");
      });
    return () => ac.abort();
  }, []);

  const projects = latest
    ? [latest, ...remote.filter((item) => item.slug !== latest.slug)]
    : remote;
  const currentSlug = latest?.slug ?? activeSlug;

  async function makeActive(slug: string) {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setActiveSlug(slug);
    onSelect?.(slug);
  }

  return (
    <div id="sites-list" className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-[#2a2a32] px-3 py-2">
        <p className="text-[10px] font-semibold tracking-[0.24em] text-[#d4a574] uppercase">Sites for other people</p>
        <p className="text-xs text-[#b9a89a]">Your Jordan Bennett homepage stays put. These are the new websites.</p>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {error ? <p className="text-sm text-[#d4a574]">{error}</p> : null}
        {projects.length === 0 ? (
          <p className="text-sm text-[#b9a89a]">
            None yet. In Builder, say “build a white and blue site” or paste a https link to clone. That creates a new
            public page — it does not replace this one.
          </p>
        ) : (
          projects.map((item) => (
            <article
              key={item.slug}
              className={`border px-3 py-2 ${item.slug === currentSlug ? "border-[#d4a574]" : "border-[#2a2a32]"}`}
            >
              <p className="text-sm text-[#f3eee8]">{item.name}</p>
              <p className="text-[11px] text-[#7d7368]">
                {item.clientName} · {item.source} · {item.url}
              </p>
              <div className="mt-2 flex gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#d4a574] px-2 py-1 text-[11px] font-semibold text-[#1a140f]"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => void makeActive(item.slug)}
                  className="border border-[#2a2a32] px-2 py-1 text-[11px] text-[#b9a89a]"
                >
                  Edit next
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
