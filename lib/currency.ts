export const CURRENCY_CODES = [
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RON",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "USD",
  "ZAR",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  AUD: "Australian Dollar",
  BRL: "Brazilian Real",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  CZK: "Czech Koruna",
  DKK: "Danish Krone",
  EUR: "Euro",
  GBP: "British Pound",
  HKD: "Hong Kong Dollar",
  HUF: "Hungarian Forint",
  IDR: "Indonesian Rupiah",
  ILS: "Israeli Shekel",
  INR: "Indian Rupee",
  ISK: "Icelandic Krona",
  JPY: "Japanese Yen",
  KRW: "South Korean Won",
  MXN: "Mexican Peso",
  MYR: "Malaysian Ringgit",
  NOK: "Norwegian Krone",
  NZD: "New Zealand Dollar",
  PHP: "Philippine Peso",
  PLN: "Polish Zloty",
  RON: "Romanian Leu",
  SEK: "Swedish Krona",
  SGD: "Singapore Dollar",
  THB: "Thai Baht",
  TRY: "Turkish Lira",
  USD: "US Dollar",
  ZAR: "South African Rand",
};

const ZERO_DECIMAL = new Set<CurrencyCode>(["HUF", "IDR", "ISK", "JPY", "KRW"]);

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
  cny: "CNY",
  yuan: "CNY",
  rmb: "CNY",
  krw: "KRW",
  won: "KRW",
  brl: "BRL",
  real: "BRL",
  reais: "BRL",
  audollar: "AUD",
  nzdollar: "NZD",
  hkd: "HKD",
  sgd: "SGD",
  thb: "THB",
  baht: "THB",
  zar: "ZAR",
  rand: "ZAR",
  sek: "SEK",
  nok: "NOK",
  dkk: "DKK",
  krone: "NOK",
  kronor: "SEK",
  try: "TRY",
  lira: "TRY",
  pln: "PLN",
  zloty: "PLN",
  ils: "ILS",
  shekel: "ILS",
  shekels: "ILS",
  php: "PHP",
  myr: "MYR",
  ringgit: "MYR",
  idr: "IDR",
  rupiah: "IDR",
  huf: "HUF",
  forint: "HUF",
  czk: "CZK",
  koruna: "CZK",
  ron: "RON",
  leu: "RON",
  isk: "ISK",
};

const NAME_PATTERN =
  "cad|usd|eur|gbp|aud|nzd|jpy|chf|mxn|inr|cny|krw|brl|hkd|sgd|thb|zar|sek|nok|dkk|try|pln|ils|php|myr|idr|huf|czk|ron|isk|canadian dollars?|us dollars?|dollars?|euros?|pounds?|sterling|yen|rupees?|pesos?|francs?|yuan|won|baht|rand|shekels?|ringgit|rupiah|zloty|lira|quid|loonie|bucks?";

export type MoneyQuery = {
  amount: number;
  from: CurrencyCode;
  to?: CurrencyCode;
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

export function resolveCurrency(raw: string): CurrencyCode | null {
  const key = raw.trim().toLowerCase().replace(/[$.]/g, "");
  if (isCurrencyCode(key.toUpperCase())) return key.toUpperCase() as CurrencyCode;
  return ALIASES[key] ?? null;
}

export function moneyFractionDigits(code: CurrencyCode) {
  return ZERO_DECIMAL.has(code) ? 0 : 2;
}

function validAmount(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1_000_000_000;
}

export function parseMoney(text: string): MoneyQuery | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (!cleaned) return null;

  const pair = cleaned.match(
    new RegExp(
      `^\\$?\\s*(\\d+(?:\\.\\d{1,4})?)\\s*(${NAME_PATTERN})\\s+(?:to|in|into)\\s+(${NAME_PATTERN})\\s*$`,
      "i",
    ),
  );
  if (pair) {
    const amount = Number(pair[1]);
    const from = resolveCurrency(pair[2]);
    const to = resolveCurrency(pair[3]);
    if (!validAmount(amount) || !from || !to) return null;
    return { amount, from, to };
  }

  const amountFirst = cleaned.match(new RegExp(`^\\$?\\s*(\\d+(?:\\.\\d{1,4})?)\\s*(?:(${NAME_PATTERN}))?\\s*$`, "i"));
  if (amountFirst) {
    const amount = Number(amountFirst[1]);
    if (!validAmount(amount)) return null;
    const from = amountFirst[2] ? resolveCurrency(amountFirst[2]) : "CAD";
    if (!from) return null;
    return { amount, from };
  }

  const codeFirst = cleaned.match(new RegExp(`^(${NAME_PATTERN})\\s*\\$?\\s*(\\d+(?:\\.\\d{1,4})?)\\s*$`, "i"));
  if (codeFirst) {
    const from = resolveCurrency(codeFirst[1]);
    const amount = Number(codeFirst[2]);
    if (!from || !validAmount(amount)) return null;
    return { amount, from };
  }

  return null;
}

export function looksLikeMoney(text: string) {
  if (parseMoney(text)) return true;
  return /\b(cad|usd|eur|gbp|cny|jpy|convert|currency|exchange)\b/i.test(text) && /\d/.test(text);
}

export function formatMoney(amount: number, code: CurrencyCode) {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: code,
      maximumFractionDigits: moneyFractionDigits(code),
    }).format(amount);
  } catch {
    return `${amount.toFixed(moneyFractionDigits(code))} ${code}`;
  }
}

export function formatConversion(
  input: MoneyQuery,
  rates: Partial<Record<CurrencyCode, number>>,
  date?: string,
) {
  const lines = [`${formatMoney(input.amount, input.from)} is about:`];
  if (input.to && input.to !== input.from && typeof rates[input.to] === "number") {
    lines.push(`• ${formatMoney(rates[input.to]!, input.to)} (${CURRENCY_NAMES[input.to]})`);
    lines.push("Every other currency:");
  }
  for (const code of CURRENCY_CODES) {
    if (code === input.from) continue;
    if (code === input.to) continue;
    const value = rates[code];
    if (typeof value !== "number") continue;
    lines.push(`• ${formatMoney(value, code)} (${code})`);
  }
  if (date) lines.push(`Rates for ${date}.`);
  return lines.join("\n");
}
