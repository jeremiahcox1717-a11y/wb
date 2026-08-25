"use client";

import { FormEvent, useState } from "react";
import { DomainHits } from "@/components/domain-hits";
import type { DomainHit } from "@/lib/domain-shop";
import type { UrlScan } from "@/lib/url-guard";

export function UrlDesk() {
  const [makeInput, setMakeInput] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [hits, setHits] = useState<DomainHit[]>([]);
  const [result, setResult] = useState<UrlScan | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function scan(url: string) {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a URL first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/urls/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await response.json()) as UrlScan & { error?: string };
      if (!response.ok) {
        setError(data.error || "Could not scan that.");
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onMake(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/domains/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: makeInput }),
      });
      const data = (await response.json()) as { error?: string; hits?: DomainHit[] };
      if (!response.ok) {
        setHits([]);
        setError(data.error || "Could not search that name.");
        return;
      }
      const next = data.hits ?? [];
      setHits(next);
      const first = next[0];
      if (first) setScanInput(first.url);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onScan(event: FormEvent) {
    event.preventDefault();
    await scan(scanInput);
  }

  return (
    <div id="url-desk" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2 text-[#f3eee8]">
      <p className="text-xs leading-5 text-[#b9a89a]">
        Search a real public .com, then buy it at GoDaddy so it works everywhere. This site cannot issue the domain itself. Or paste a link for YES/NO.
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <form onSubmit={onMake} className="space-y-1.5">
          <label htmlFor="url-make-input" className="block text-[10px] tracking-[0.2em] text-[#7d7368] uppercase">
            Search a public domain
          </label>
          <input
            id="url-make-input"
            value={makeInput}
            onChange={(event) => setMakeInput(event.target.value)}
            placeholder="Jordan Bennett"
            className="w-full border border-[#2a2a32] bg-[#16161c] px-2 py-1.5 text-sm outline-none"
          />
          <button
            id="url-make-submit"
            type="submit"
            disabled={busy || !makeInput.trim()}
            className="bg-[#d4a574] px-2.5 py-1.5 text-[11px] font-semibold text-[#1a140f] disabled:opacity-50"
          >
            {busy ? "Searching…" : "Search"}
          </button>
        </form>

        <form onSubmit={onScan} className="space-y-1.5">
          <label htmlFor="url-scan-input" className="block text-[10px] tracking-[0.2em] text-[#7d7368] uppercase">
            Scan a URL
          </label>
          <input
            id="url-scan-input"
            value={scanInput}
            onChange={(event) => setScanInput(event.target.value)}
            placeholder="https://…"
            className="w-full border border-[#2a2a32] bg-[#16161c] px-2 py-1.5 text-sm outline-none"
          />
          <button
            id="url-scan-submit"
            type="submit"
            disabled={busy || !scanInput.trim()}
            className="border border-[#d4a574] px-2.5 py-1.5 text-[11px] font-semibold text-[#d4a574] disabled:opacity-50"
          >
            {busy ? "Working…" : "Scan"}
          </button>
        </form>
      </div>

      <DomainHits hits={hits} compact listId="url-made-value" />

      {error ? <p className="mt-2 text-xs text-[#e8a0a0]">{error}</p> : null}

      {result ? (
        <div
          id="url-scan-result"
          className="mt-2 border px-3 py-2"
          style={{
            borderColor: result.answer === "yes" ? "#7dffb3" : "#e8a0a0",
            background: result.answer === "yes" ? "#102018" : "#241414",
          }}
        >
          <p
            id="url-scan-answer"
            className="font-serif text-3xl leading-none"
            style={{ color: result.answer === "yes" ? "#7dffb3" : "#e8a0a0" }}
          >
            {result.answer === "yes" ? "YES" : "NO"}
          </p>
          {result.url ? <p className="mt-1 break-all text-[11px] text-[#b9a89a]">{result.url}</p> : null}
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-[#d7cdc2]">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
