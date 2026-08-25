"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CURRENCY_CODES,
  CURRENCY_NAMES,
  CURRENCY_TYPE_OPTIONS,
  formatMoney,
  readCurrencyInput,
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
  background: "#111111",
  border: "2px solid #f2f2f0",
  color: "#f3f3f1",
  borderRadius: "var(--wb-radius-btn)",
} as const;

function TypeBox({
  id,
  label,
  listId,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  listId: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 flex-1 text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--wb-text)" }}>
      {label}
      <input
        id={id}
        type="text"
        inputMode="text"
        value={value}
        list={listId}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="relative z-10 mt-1 h-12 w-full min-w-[10rem] px-3 text-base outline-none"
        style={fieldStyle}
      />
      <datalist id={listId}>
        {CURRENCY_TYPE_OPTIONS.map((item) => (
          <option key={`${listId}-${item.value}`} value={item.value}>
            {item.code}
          </option>
        ))}
      </datalist>
    </label>
  );
}

export function CurrencyCalculator({ heading, body }: { heading?: string; body?: string }) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<CurrencyCode>("CAD");
  const [to, setTo] = useState<CurrencyCode>("EUR");
  const [fromTyped, setFromTyped] = useState("");
  const [toTyped, setToTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Conversion | null>(null);

  const allRates = useMemo(() => {
    if (!result) return [];
    return CURRENCY_CODES.filter((code) => code !== result.from)
      .map((code) => ({ code, value: result.rates[code] }))
      .filter((item): item is { code: CurrencyCode; value: number } => typeof item.value === "number");
  }, [result]);

  function applyTyped(side: "from" | "to", value: string) {
    if (side === "from") {
      setFromTyped(value);
      const matched = readCurrencyInput(value);
      if (matched) setFrom(matched);
      return;
    }
    setToTyped(value);
    const matched = readCurrencyInput(value);
    if (matched) setTo(matched);
  }

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
    const nextFrom = readCurrencyInput(fromTyped, from);
    const nextTo = readCurrencyInput(toTyped, to);
    if (!nextFrom) {
      setError("Type a from country or currency, like Canada or CAD.");
      return;
    }
    if (!nextTo) {
      setError("Type a to country or currency, like Japan or euros.");
      return;
    }
    setFrom(nextFrom);
    setTo(nextTo);
    await convert(nextFrom, nextTo);
  }

  function swap() {
    const nextFrom = readCurrencyInput(toTyped, to) ?? to;
    const nextTo = readCurrencyInput(fromTyped, from) ?? from;
    const nextFromTyped = toTyped;
    const nextToTyped = fromTyped;
    setFrom(nextFrom);
    setTo(nextTo);
    setFromTyped(nextFromTyped);
    setToTyped(nextToTyped);
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
        {body || "Type a country or currency on both sides. Canada to Japan, CAD to EUR — either works."}
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--wb-text)" }}>
          Amount
          <input
            id="currency-amount"
            type="text"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="100"
            className="relative z-10 mt-1 h-12 w-full px-3 text-base outline-none"
            style={fieldStyle}
          />
        </label>

        <div id="currency-type-both" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TypeBox
            id="currency-from-type"
            listId="currency-from-list"
            label="From country or currency"
            value={fromTyped}
            placeholder="Canada, CAD, euros…"
            onChange={(value) => applyTyped("from", value)}
          />
          <button
            id="currency-swap"
            type="button"
            onClick={swap}
            className="h-12 shrink-0 px-4 text-xs font-semibold"
            style={{
              border: "2px solid #f2f2f0",
              borderRadius: "var(--wb-radius-btn)",
              color: "var(--wb-text)",
            }}
          >
            Swap
          </button>
          <TypeBox
            id="currency-to-type"
            listId="currency-to-list"
            label="To country or currency"
            value={toTyped}
            placeholder="Japan, yen, USD…"
            onChange={(value) => applyTyped("to", value)}
          />
        </div>

        <p className="text-xs" style={{ color: "var(--wb-muted)" }}>
          Using {from} → {to}. Type a country name or a currency code in the boxes above.
        </p>

        <button
          id="currency-convert"
          type="submit"
          disabled={busy || !amount.trim()}
          className="h-12 w-full px-4 text-sm font-semibold disabled:opacity-50"
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
