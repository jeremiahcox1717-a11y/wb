"use client";

import { FormEvent, useState } from "react";

type Conversion = {
  fromLabel: string;
  date?: string | null;
  rates: Record<string, number>;
  summary: string;
  error?: string;
};

const LABELS: Record<string, string> = {
  EUR: "Euros",
  GBP: "Pounds",
  USD: "US dollars",
  CAD: "Canadian dollars",
};

export function CurrencyCalculator({ heading, body }: { heading?: string; body?: string }) {
  const [text, setText] = useState("100 CAD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Conversion | null>(null);

  async function convert(value: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/currency/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = (await response.json()) as Conversion;
      if (!response.ok) {
        setResult(null);
        setError(data.error || "Could not convert that.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await convert(text);
  }

  return (
    <div
      id="currency-calculator"
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
        {body || "Type an amount like 100 CAD. I will tell you the euros and pounds."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="currency-amount">
          Amount and currency
        </label>
        <input
          id="currency-amount"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="100 CAD"
          className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
          style={{
            background: "var(--wb-bg)",
            border: "1px solid var(--wb-border)",
            color: "var(--wb-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        />
        <button
          id="currency-convert"
          type="submit"
          disabled={busy || !text.trim()}
          className="px-5 py-3 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--wb-accent)",
            color: "var(--wb-accent-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        >
          {busy ? "Converting…" : "Convert"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {["100 CAD", "50 pounds", "20 euros"].map((item) => (
          <button
            key={item}
            type="button"
            disabled={busy}
            onClick={() => {
              setText(item);
              void convert(item);
            }}
            className="px-3 py-1 text-xs"
            style={{ border: "1px solid var(--wb-border)", borderRadius: "var(--wb-radius-btn)" }}
          >
            {item}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-4 text-sm" style={{ color: "var(--wb-accent)" }}>
          {error}
        </p>
      ) : null}
      {result ? (
        <div id="currency-result" className="mt-6 space-y-2">
          <p className="text-sm" style={{ color: "var(--wb-muted)" }}>
            {result.fromLabel} is about
          </p>
          {Object.entries(result.rates).map(([code, value]) => (
            <p key={code} className="text-2xl" style={{ fontFamily: "var(--wb-display)" }}>
              {value.toLocaleString("en-CA", {
                style: "currency",
                currency: code,
                maximumFractionDigits: code === "JPY" ? 0 : 2,
              })}{" "}
              <span className="text-base" style={{ color: "var(--wb-muted)" }}>
                {LABELS[code] || code}
              </span>
            </p>
          ))}
          {result.date ? (
            <p className="pt-2 text-xs" style={{ color: "var(--wb-muted)" }}>
              Live rate for {result.date}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
