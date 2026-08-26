import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { hostIsPublic } from "@/lib/public-fetch";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { scanUrl, type UrlScan } from "@/lib/url-guard";

export const runtime = "nodejs";

async function probe(url: string): Promise<UrlScan> {
  const parsed = new URL(url);
  try {
    const publicHost = await hostIsPublic(parsed.hostname);
    if (!publicHost) {
      return { answer: "no", url, reasons: ["That host is not a public website."] };
    }
  } catch {
    return { answer: "no", url, reasons: ["That website name could not be found."] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "wb-url-guard/1.0" },
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "wb-url-guard/1.0" },
      });
    }
    if (response.status >= 200 && response.status < 400) {
      return {
        answer: "yes",
        url,
        reasons: ["It looks like a normal https address, and the site answered."],
      };
    }
    if (response.status === 404) {
      return { answer: "no", url, reasons: ["The page is not there (404)."] };
    }
    if (response.status >= 400) {
      return { answer: "no", url, reasons: [`The site answered with an error (${response.status}).`] };
    }
    return { answer: "yes", url, reasons: ["It looks like a normal https address."] };
  } catch {
    return {
      answer: "yes",
      url,
      reasons: ["The address looks normal. The site did not answer in time, so only the writing of the link was checked."],
    };
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

  const limited = rateLimit(`url-scan:${clientKey(request)}`, 20, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { url?: string; live?: boolean } | null;
  const value = body?.url?.trim() ?? "";
  if (!value) {
    return NextResponse.json({ error: "Paste a URL first." }, { status: 400 });
  }
  if (value.length > 2000) {
    return NextResponse.json({ error: "That URL is too long." }, { status: 400 });
  }

  const staticScan = scanUrl(value);
  if (staticScan.answer === "no" || !staticScan.url || body?.live === false) {
    return NextResponse.json(staticScan);
  }

  const live = await probe(staticScan.url);
  return NextResponse.json(live);
}
