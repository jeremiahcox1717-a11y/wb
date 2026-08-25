import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import {
  CURRENCY_CODES,
  formatConversion,
  formatMoney,
  isCurrencyCode,
  parseMoney,
  resolveCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function frankfurter(amount: number, from: CurrencyCode) {
  const url = new URL("https://api.frankfurter.app/latest");
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("from", from);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Rates unavailable (${response.status})`);
    const data = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const rates: Partial<Record<CurrencyCode, number>> = {};
    for (const [code, value] of Object.entries(data.rates ?? {})) {
      if (isCurrencyCode(code) && typeof value === "number") rates[code] = value;
    }
    return { date: data.date, rates };
  } finally {
    clearTimeout(timer);
  }
}

function parseBody(body: { text?: string; amount?: number; from?: string; to?: string } | null) {
  if (typeof body?.amount === "number" && body.from) {
    const from = resolveCurrency(body.from);
    if (!from) return null;
    const to = body.to ? resolveCurrency(body.to) : undefined;
    if (body.to && !to) return null;
    if (!Number.isFinite(body.amount) || body.amount < 0 || body.amount > 1_000_000_000) return null;
    return { amount: body.amount, from, to: to ?? undefined };
  }
  return parseMoney(String(body?.text ?? ""));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`currency:${clientKey(request)}`, 40, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { text?: string; amount?: number; from?: string; to?: string }
    | null;
  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Pick two currencies, or try something like 100 CAD to EUR." },
      { status: 400 },
    );
  }

  try {
    const { date, rates } = await frankfurter(parsed.amount, parsed.from);
    const to = parsed.to;
    const converted =
      !to ? undefined : to === parsed.from ? parsed.amount : rates[to];
    return NextResponse.json({
      amount: parsed.amount,
      from: parsed.from,
      to: to ?? null,
      fromLabel: formatMoney(parsed.amount, parsed.from),
      toLabel: to && typeof converted === "number" ? formatMoney(converted, to) : null,
      converted: typeof converted === "number" ? converted : null,
      date: date ?? null,
      rates,
      codes: CURRENCY_CODES,
      summary: formatConversion(parsed, rates, date),
    });
  } catch {
    return NextResponse.json({ error: "Could not load live exchange rates. Try again in a moment." }, { status: 503 });
  }
}
