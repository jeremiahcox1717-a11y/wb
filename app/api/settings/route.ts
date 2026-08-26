import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { publicSettings, readSettings, writeSettings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(publicSettings(await readSettings()));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    apiKey?: string;
    model?: string;
    provider?: "openai" | "anthropic" | "compatible";
    baseUrl?: string;
  } | null;
  const settings = await writeSettings({
    apiKey: typeof body?.apiKey === "string" ? body.apiKey.trim() : undefined,
    model: typeof body?.model === "string" ? body.model.trim() : undefined,
    provider: body?.provider,
    baseUrl: typeof body?.baseUrl === "string" ? body.baseUrl.trim() : undefined,
  });
  return NextResponse.json(publicSettings(settings));
}
