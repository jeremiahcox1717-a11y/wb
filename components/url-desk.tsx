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
    <div id="url-desk" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3 text-[#f3eee8]">
      <p className="text-sm leading-6 text-[#b9a89a]">
        Make a clean URL, or paste a link someone sent you. The scanner answers <strong className="text-[#f3eee8]">YES</strong> or{" "}
        <strong className="text-[#f3eee8]">NO</strong>.
      </p>

      <form onSubmit={onMake} className="mt-4 space-y-2">
        <label htmlFor="url-make-input" className="block text-[10px] tracking-[0.2em] text-[#7d7368] uppercase">
          Make a URL
        </label>
        <input
          id="url-make-input"
          value={makeInput}
          onChange={(event) => setMakeInput(event.target.value)}
          placeholder="mybakery.com or About us"
          className="w-full border border-[#2a2a32] bg-[#16161c] px-3 py-2 text-sm outline-none"
        />
        <button
          id="url-make-submit"
          type="submit"
          disabled={busy || !makeInput.trim()}
          className="bg-[#d4a574] px-3 py-2 text-xs font-semibold text-[#1a140f] disabled:opacity-50"
        >
          Make URL
        </button>
      </form>

      {made ? (
        <p className="mt-3 break-all text-sm text-[#d4a574]">
          Made: <span id="url-made-value">{made}</span>
        </p>
      ) : null}

      <form onSubmit={onScan} className="mt-6 space-y-2">
        <label htmlFor="url-scan-input" className="block text-[10px] tracking-[0.2em] text-[#7d7368] uppercase">
          Scan a URL someone asked you about
        </label>
        <input
          id="url-scan-input"
          value={scanInput}
          onChange={(event) => setScanInput(event.target.value)}
          placeholder="https://…"
          className="w-full border border-[#2a2a32] bg-[#16161c] px-3 py-2 text-sm outline-none"
        />
        <button
          id="url-scan-submit"
          type="submit"
          disabled={busy || !scanInput.trim()}
          className="border border-[#d4a574] px-3 py-2 text-xs font-semibold text-[#d4a574] disabled:opacity-50"
        >
          {busy ? "Scanning…" : "Scan — yes or no"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-[#e8a0a0]">{error}</p> : null}

      {result ? (
        <div
          id="url-scan-result"
          className="mt-5 border px-4 py-4"
          style={{
            borderColor: result.answer === "yes" ? "#7dffb3" : "#e8a0a0",
            background: result.answer === "yes" ? "#102018" : "#241414",
          }}
        >
          <p
            id="url-scan-answer"
            className="font-serif text-5xl"
            style={{ color: result.answer === "yes" ? "#7dffb3" : "#e8a0a0" }}
          >
            {result.answer === "yes" ? "YES" : "NO"}
          </p>
          {result.url ? <p className="mt-2 break-all text-xs text-[#b9a89a]">{result.url}</p> : null}
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#d7cdc2]">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
