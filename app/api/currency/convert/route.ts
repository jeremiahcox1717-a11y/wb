import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import {
  DEFAULT_TARGETS,
  formatConversion,
  formatMoney,
  isCurrencyCode,
  parseMoney,
  type CurrencyCode,
} from "@/lib/currency";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function frankfurter(amount: number, from: CurrencyCode, to: CurrencyCode[]) {
  const unique = [...new Set(to.filter((code) => code !== from))];
  const url = new URL("https://api.frankfurter.app/latest");
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("from", from);
  url.searchParams.set("to", unique.join(","));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Rates unavailable (${response.status})`);
    const data = (await response.json()) as {
      amount?: number;
      base?: string;
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
    | { text?: string; amount?: number; from?: string }
    | null;
  const parsed =
    typeof body?.amount === "number" && body.from
      ? parseMoney(`${body.amount} ${body.from}`)
      : parseMoney(String(body?.text ?? ""));
  if (!parsed) {
    return NextResponse.json(
      { error: "Try something like 100 CAD, 50 pounds, or 20 euros." },
      { status: 400 },
    );
  }

  try {
    const targets = [...DEFAULT_TARGETS, "CAD"] as CurrencyCode[];
    const { date, rates } = await frankfurter(parsed.amount, parsed.from, targets);
    return NextResponse.json({
      amount: parsed.amount,
      from: parsed.from,
      fromLabel: formatMoney(parsed.amount, parsed.from),
      date: date ?? null,
      rates,
      summary: formatConversion(parsed, rates, date),
    });
  } catch {
    return NextResponse.json({ error: "Could not load live exchange rates. Try again in a moment." }, { status: 503 });
  }
}
