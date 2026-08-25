"use client";

import { FormEvent, useState } from "react";
import { generateUrl, type UrlScan } from "@/lib/url-guard";

export function UrlDesk() {
  const [makeInput, setMakeInput] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [made, setMade] = useState("");
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
    const generated = generateUrl(makeInput, window.location.origin);
    if (!generated.ok) {
      setError(generated.error);
      setMade("");
      return;
    }
    setMade(generated.url);
    setScanInput(generated.url);
    await scan(generated.url);
  }

  async function onScan(event: FormEvent) {
    event.preventDefault();
    await scan(scanInput);
  }

  return (
    <div id="url-desk" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2 text-[#f3f3f1]">
      <p className="text-xs leading-5 text-[#a3a39b]">
        Make a clean URL, or paste a link. Answers <strong className="text-[#f3f3f1]">YES</strong> or{" "}
        <strong className="text-[#f3f3f1]">NO</strong>.
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <form onSubmit={onMake} className="space-y-1.5">
          <label htmlFor="url-make-input" className="block text-[10px] tracking-[0.2em] text-[#7d7d7d] uppercase">
            Make a URL
          </label>
          <input
            id="url-make-input"
            value={makeInput}
            onChange={(event) => setMakeInput(event.target.value)}
            placeholder="mybakery.com"
            className="w-full border border-[#2a2a32] bg-[#16161c] px-2 py-1.5 text-sm outline-none"
          />
          <button
            id="url-make-submit"
            type="submit"
            disabled={busy || !makeInput.trim()}
            className="bg-[#f2f2f0] px-2.5 py-1.5 text-[11px] font-semibold text-[#111111] disabled:opacity-50"
          >
            Make URL
          </button>
        </form>

        <form onSubmit={onScan} className="space-y-1.5">
          <label htmlFor="url-scan-input" className="block text-[10px] tracking-[0.2em] text-[#7d7d7d] uppercase">
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
            className="border border-[#f2f2f0] px-2.5 py-1.5 text-[11px] font-semibold text-[#f2f2f0] disabled:opacity-50"
          >
            {busy ? "Scanning…" : "Scan"}
          </button>
        </form>
      </div>

      {made ? (
        <p className="mt-2 break-all text-xs text-[#f2f2f0]">
          Made: <span id="url-made-value">{made}</span>
        </p>
      ) : null}

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
          {result.url ? <p className="mt-1 break-all text-[11px] text-[#a3a39b]">{result.url}</p> : null}
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
