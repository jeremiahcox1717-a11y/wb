export const CURRENCY_CODES = ["CAD", "USD", "EUR", "GBP", "AUD", "NZD", "JPY", "CHF", "MXN", "INR"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

const ALIASES: Record<string, CurrencyCode> = {
  cad: "CAD",
  canadian: "CAD",
  "canadian dollar": "CAD",
  "canadian dollars": "CAD",
  loonie: "CAD",
  usd: "USD",
  dollar: "USD",
  dollars: "USD",
  "us dollar": "USD",
  "us dollars": "USD",
  buck: "USD",
  bucks: "USD",
  eur: "EUR",
  euro: "EUR",
  euros: "EUR",
  gbp: "GBP",
  pound: "GBP",
  pounds: "GBP",
  sterling: "GBP",
  "british pound": "GBP",
  "british pounds": "GBP",
  quid: "GBP",
  aud: "AUD",
  nzd: "NZD",
  jpy: "JPY",
  yen: "JPY",
  chf: "CHF",
  franc: "CHF",
  francs: "CHF",
  mxn: "MXN",
  peso: "MXN",
  pesos: "MXN",
  inr: "INR",
  rupee: "INR",
  rupees: "INR",
};

export type MoneyQuery = {
  amount: number;
  from: CurrencyCode;
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

export function resolveCurrency(raw: string): CurrencyCode | null {
  const key = raw.trim().toLowerCase().replace(/[$.]/g, "");
  if (isCurrencyCode(key.toUpperCase())) return key.toUpperCase() as CurrencyCode;
  return ALIASES[key] ?? null;
}

export function parseMoney(text: string): MoneyQuery | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (!cleaned) return null;

  const amountFirst = cleaned.match(
    /^\$?\s*(\d+(?:\.\d{1,4})?)\s*(?:([a-z]{3}|canadian dollars?|us dollars?|dollars?|euros?|pounds?|sterling|yen|rupees?|pesos?|francs?|quid|loonie|bucks?))?\s*$/i,
  );
  if (amountFirst) {
    const amount = Number(amountFirst[1]);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return null;
    const from = amountFirst[2] ? resolveCurrency(amountFirst[2]) : "CAD";
    if (!from) return null;
    return { amount, from };
  }

  const codeFirst = cleaned.match(
    /^(cad|usd|eur|gbp|aud|nzd|jpy|chf|mxn|inr|canadian dollars?|us dollars?|euros?|pounds?|sterling)\s*\$?\s*(\d+(?:\.\d{1,4})?)\s*$/i,
  );
  if (codeFirst) {
    const from = resolveCurrency(codeFirst[1]);
    const amount = Number(codeFirst[2]);
    if (!from || !Number.isFinite(amount) || amount < 0) return null;
    return { amount, from };
  }

  return null;
}

export function looksLikeMoney(text: string) {
  if (parseMoney(text)) return true;
  return /\b(cad|usd|eur|gbp|euro|euros|pound|pounds|convert)\b/i.test(text) && /\d/.test(text);
}

export function formatMoney(amount: number, code: CurrencyCode) {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "JPY" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

export const DEFAULT_TARGETS: CurrencyCode[] = ["EUR", "GBP", "USD"];

export function formatConversion(input: MoneyQuery, rates: Partial<Record<CurrencyCode, number>>, date?: string) {
  const lines = [`${formatMoney(input.amount, input.from)} is about:`];
  for (const code of DEFAULT_TARGETS) {
    if (code === input.from) continue;
    const value = rates[code];
    if (typeof value !== "number") continue;
    const label = code === "EUR" ? "euros" : code === "GBP" ? "pounds" : code;
    lines.push(`• ${formatMoney(value, code)} (${label})`);
  }
  if (input.from !== "CAD" && typeof rates.CAD === "number") {
    lines.push(`• ${formatMoney(rates.CAD, "CAD")} (CAD)`);
  }
  if (date) lines.push(`Rates for ${date}.`);
  return lines.join("\n");
}
