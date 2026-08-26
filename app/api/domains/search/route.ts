import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { formatDomainSearch, searchPublicDomains } from "@/lib/domain-shop";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`domain-search:${clientKey(request)}`, 20, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Type a name first." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }

  const result = await searchPublicDomains(name);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    query: result.query,
    hits: result.hits,
    summary: formatDomainSearch(result),
  });
}
