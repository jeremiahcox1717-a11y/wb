"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CURRENCY_CODES,
  CURRENCY_NAMES,
  formatMoney,
  type CurrencyCode,
} from "@/lib/currency";

type Conversion = {
  from: CurrencyCode;
  to?: CurrencyCode | null;
  fromLabel: string;
  toLabel?: string | null;
  converted?: number | null;
  date?: string | null;
  rates: Partial<Record<CurrencyCode, number>>;
  summary: string;
  error?: string;
};

const fieldStyle = {
  background: "var(--wb-bg)",
  border: "1px solid var(--wb-border)",
  color: "var(--wb-text)",
  borderRadius: "var(--wb-radius-btn)",
} as const;

function CurrencySelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
}) {
  return (
    <label className="block min-w-0 flex-1 text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--wb-muted)" }}>
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as CurrencyCode)}
        className="mt-1 w-full px-3 py-2 text-sm outline-none"
        style={fieldStyle}
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {code} — {CURRENCY_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CurrencyCalculator({ heading, body }: { heading?: string; body?: string }) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<CurrencyCode>("CAD");
  const [to, setTo] = useState<CurrencyCode>("EUR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Conversion | null>(null);

  const allRates = useMemo(() => {
    if (!result) return [];
    return CURRENCY_CODES.filter((code) => code !== result.from)
      .map((code) => ({ code, value: result.rates[code] }))
      .filter((item): item is { code: CurrencyCode; value: number } => typeof item.value === "number");
  }, [result]);

  async function convert(nextFrom = from, nextTo = to, nextAmount = amount) {
    const value = Number(nextAmount);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter an amount.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/currency/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, from: nextFrom, to: nextTo }),
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
    await convert();
  }

  function swap() {
    const nextFrom = to;
    const nextTo = from;
    setFrom(nextFrom);
    setTo(nextTo);
    void convert(nextFrom, nextTo);
  }

  return (
    <div
      id="currency-calculator"
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
        {body || "Pick any two currencies and convert both ways. Every other live rate is listed below."}
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--wb-muted)" }}>
          Amount
          <input
            id="currency-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="100"
            className="mt-1 w-full px-3 py-2 text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <CurrencySelect id="currency-from" label="From" value={from} onChange={setFrom} />
          <button
            id="currency-swap"
            type="button"
            onClick={swap}
            className="h-10 shrink-0 px-3 text-xs font-semibold"
            style={{
              border: "1px solid var(--wb-border)",
              borderRadius: "var(--wb-radius-btn)",
              color: "var(--wb-text)",
            }}
          >
            Swap
          </button>
          <CurrencySelect id="currency-to" label="To" value={to} onChange={setTo} />
        </div>
        <button
          id="currency-convert"
          type="submit"
          disabled={busy || !amount.trim()}
          className="h-10 w-full px-4 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--wb-accent)",
            color: "var(--wb-accent-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        >
          {busy ? "Converting…" : "Convert"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm" style={{ color: "var(--wb-accent)" }}>
          {error}
        </p>
      ) : null}

      {result ? (
        <div id="currency-result" className="mt-5">
          <p className="text-sm" style={{ color: "var(--wb-muted)" }}>
            {result.fromLabel}
            {result.to ? ` → ${CURRENCY_NAMES[result.to]}` : ""}
          </p>
          {result.toLabel ? (
            <p id="currency-pair-value" className="text-3xl" style={{ fontFamily: "var(--wb-display)" }}>
              {result.toLabel}
            </p>
          ) : null}
          {result.date ? (
            <p className="mt-1 text-xs" style={{ color: "var(--wb-muted)" }}>
              Live rate for {result.date}
            </p>
          ) : null}

          <p className="mt-5 text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--wb-muted)" }}>
            All currencies
          </p>
          <div id="currency-all-rates" className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allRates.map((item) => (
              <div
                key={item.code}
                className={`px-3 py-2 text-sm ${item.code === result.to ? "outline" : ""}`}
                style={{
                  border: "1px solid var(--wb-border)",
                  borderRadius: "var(--wb-radius-btn)",
                  outlineColor: "var(--wb-accent)",
                }}
              >
                <p className="text-[10px] tracking-[0.16em] uppercase" style={{ color: "var(--wb-muted)" }}>
                  {item.code} · {CURRENCY_NAMES[item.code]}
                </p>
                <p>{formatMoney(item.value, item.code)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
