"use client";

import { FormEvent, useState } from "react";
import { DomainHits } from "@/components/domain-hits";
import type { DomainHit } from "@/lib/domain-shop";

type SearchResponse = {
  query?: string;
  hits?: DomainHit[];
  summary?: string;
  error?: string;
};

export function UrlMakerSection({ heading, body }: { heading?: string; body?: string }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hits, setHits] = useState<DomainHit[]>([]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/domains/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as SearchResponse;
      if (!response.ok) {
        setHits([]);
        setError(data.error || "Could not search that name.");
        return;
      }
      setHits(data.hits ?? []);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id="url-maker"
      className="p-4 md:p-5"
      style={{
        background: "var(--wb-surface)",
        border: "1px solid var(--wb-border)",
        borderRadius: "var(--wb-radius)",
      }}
    >
      {heading ? (
        <h3 className="text-xl" style={{ fontFamily: "var(--wb-display)" }}>
          {heading}
        </h3>
      ) : null}
      <p className="mt-1 text-sm leading-5" style={{ color: "var(--wb-muted)" }}>
        {body ||
          "Type a name. I search the real public internet. If it’s free, buy it at GoDaddy (or Namecheap / Porkbun). After you register it, that .com works on every phone, app, and browser."}
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="page-url-make">
          Name to search as a public domain
        </label>
        <input
          id="page-url-make"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jordan Bennett"
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          style={{
            background: "#111111",
            border: "2px solid #f2f2f0",
            color: "#f3f3f1",
            borderRadius: "var(--wb-radius-btn)",
          }}
        />
        <button
          id="page-url-make-submit"
          type="submit"
          disabled={busy || !name.trim()}
          className="px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--wb-accent)",
            color: "var(--wb-accent-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        >
          {busy ? "Searching…" : "Search public domains"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm">{error}</p> : null}
      <DomainHits hits={hits} listId="page-url-made-value" />
    </div>
  );
}
