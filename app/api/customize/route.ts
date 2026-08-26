import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { customizeSite } from "@/lib/ai/customize";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSettings, readSite, writeSite } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`customize:${clientKey(request)}`, 50, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { message?: string; history?: { role: "user" | "assistant"; content: string }[] }
    | null;
  const message = body?.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Ask a question or tell me what to change." }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "That request is too long." }, { status: 400 });
  }

  const current = await readSite();
  const settings = await readSettings();
  const result = await customizeSite({
    site: current,
    message,
    history: Array.isArray(body?.history) ? body.history.slice(-8) : [],
    settings,
  });
  const site = result.changed ? await writeSite(result.site) : current;
  if (result.changed) revalidatePath("/", "layout");
  return NextResponse.json({
    reply: result.reply,
    site,
    engine: result.engine,
    warning: result.warning,
    changed: result.changed,
  });
}
