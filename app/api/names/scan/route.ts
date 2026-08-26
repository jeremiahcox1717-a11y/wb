import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import {
  namesMatch,
  scanNameLocal,
  looksLikePerson,
  titleMatchesName,
  type NameScan,
} from "@/lib/name-guard";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSite } from "@/lib/store";

export const runtime = "nodejs";

type WikiSearch = {
  query?: { search?: { title: string; snippet: string }[] };
};

type WikiData = {
  search?: { label: string; description?: string }[];
};

async function publicPeople(name: string) {
  const matches: string[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  const headers = {
    Accept: "application/json",
    "User-Agent": "WBNameScan/1.0 (private owner tool)",
  };
  try {
    const wikiUrl = new URL("https://en.wikipedia.org/w/api.php");
    wikiUrl.searchParams.set("action", "query");
    wikiUrl.searchParams.set("list", "search");
    wikiUrl.searchParams.set("srsearch", `"${name}"`);
    wikiUrl.searchParams.set("srlimit", "5");
    wikiUrl.searchParams.set("format", "json");
    const wikiRes = await fetch(wikiUrl, { signal: controller.signal, headers });
    if (wikiRes.ok) {
      const wiki = (await wikiRes.json()) as WikiSearch;
      for (const hit of wiki.query?.search ?? []) {
        if (titleMatchesName(hit.title, name) || looksLikePerson(`${hit.title} ${hit.snippet}`)) {
          if (titleMatchesName(hit.title, name) || looksLikePerson(hit.snippet)) {
            matches.push(hit.title);
          }
        }
      }
    }

    const dataUrl = new URL("https://www.wikidata.org/w/api.php");
    dataUrl.searchParams.set("action", "wbsearchentities");
    dataUrl.searchParams.set("search", name);
    dataUrl.searchParams.set("language", "en");
    dataUrl.searchParams.set("limit", "6");
    dataUrl.searchParams.set("format", "json");
    const dataRes = await fetch(dataUrl, { signal: controller.signal, headers });
    if (dataRes.ok) {
      const data = (await dataRes.json()) as WikiData;
      for (const hit of data.search ?? []) {
        if (titleMatchesName(hit.label, name) && looksLikePerson(hit.description || hit.label)) {
          matches.push(hit.description ? `${hit.label} — ${hit.description}` : hit.label);
        }
      }
    }
  } catch {
    return { matches, failed: true };
  } finally {
    clearTimeout(timer);
  }
  return { matches: [...new Set(matches)].slice(0, 5), failed: false };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`name-scan:${clientKey(request)}`, 20, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Type a name first." }, { status: 400 });
  }
  const site = await readSite();
  const local = scanNameLocal(name, site.identity.ownerName);
  if (local.reasons[0] === "That name is too long to check.") {
    return NextResponse.json({ error: local.reasons[0] }, { status: 400 });
  }
  if (namesMatch(name, site.identity.ownerName)) {
    return NextResponse.json(local);
  }

  const publicHits = await publicPeople(name);
  if (publicHits.matches.length > 0) {
    const result: NameScan = {
      answer: "yes",
      name,
      matches: publicHits.matches,
      reasons: ["Someone else already uses this name publicly."],
    };
    return NextResponse.json(result);
  }
  if (publicHits.failed) {
    return NextResponse.json({
      answer: "no",
      name,
      reasons: ["Could not reach public name records. No local match besides the owner."],
    } satisfies NameScan);
  }
  return NextResponse.json({
    answer: "no",
    name,
    reasons: ["No public person with this exact name turned up."],
  } satisfies NameScan);
}
