"use client";

import { FormEvent, useState } from "react";
import type { UrlScan } from "@/lib/url-guard";

export function UrlScannerSection({ heading, body }: { heading?: string; body?: string }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UrlScan | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/urls/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as UrlScan & { error?: string };
      if (!response.ok) {
        setResult(null);
        setError(data.error || "Could not scan that.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
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
        {body || "Paste a link. YES means it looks safe to open. NO means do not open it."}
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="page-url-scan">
          URL to scan
        </label>
        <input
          id="page-url-scan"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--wb-bg)",
            border: "1px solid var(--wb-border)",
            color: "var(--wb-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        />
        <button
          id="page-url-scan-submit"
          type="submit"
          disabled={busy || !url.trim()}
          className="px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--wb-accent)",
            color: "var(--wb-accent-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        >
          {busy ? "Scanning…" : "Scan URL"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm">{error}</p> : null}
      {result ? (
        <div className="mt-3">
          <p className="font-serif text-3xl leading-none" style={{ color: result.answer === "yes" ? "#7dffb3" : "#e8a0a0" }}>
            {result.answer === "yes" ? "YES" : "NO"}
          </p>
          {result.url ? (
            <p className="mt-1 break-all text-xs" style={{ color: "var(--wb-muted)" }}>
              {result.url}
            </p>
          ) : null}
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
