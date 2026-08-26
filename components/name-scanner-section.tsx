"use client";

import { FormEvent, useState } from "react";
import type { NameScan } from "@/lib/name-guard";

export function NameScannerSection({ heading, body }: { heading?: string; body?: string }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<NameScan | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/names/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as NameScan & { error?: string };
      if (!response.ok) {
        setResult(null);
        setError(data.error || "Could not scan that name.");
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
      className="p-6 md:p-8"
      style={{
        background: "var(--wb-surface)",
        border: "1px solid var(--wb-border)",
        borderRadius: "var(--wb-radius)",
      }}
    >
      {heading ? (
        <h3 className="text-2xl" style={{ fontFamily: "var(--wb-display)" }}>
          {heading}
        </h3>
      ) : null}
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--wb-muted)" }}>
        {body ||
          "Type a person’s name. YES means someone else already uses it publicly. NO means no public match, or it is the owner of this site."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="page-name-scan">
          Name to scan
        </label>
        <input
          id="page-name-scan"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
          className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
          style={{
            background: "var(--wb-bg)",
            border: "1px solid var(--wb-border)",
            color: "var(--wb-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        />
        <button
          id="page-name-scan-submit"
          type="submit"
          disabled={busy || !name.trim()}
          className="px-5 py-3 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--wb-accent)",
            color: "var(--wb-accent-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        >
          {busy ? "Scanning…" : "Scan name"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm">{error}</p> : null}
      {result ? (
        <div className="mt-5">
          <p className="text-sm" style={{ color: "var(--wb-muted)" }}>
            Someone else has this name?
          </p>
          <p className="font-serif text-5xl" style={{ color: result.answer === "yes" ? "#e8a0a0" : "#7dffb3" }}>
            {result.answer === "yes" ? "YES" : "NO"}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {result.matches?.length ? (
            <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--wb-muted)" }}>
              {result.matches.map((match) => (
                <li key={match}>{match}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
