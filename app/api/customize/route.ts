import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { customizeSite } from "@/lib/ai/customize";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { publicUrlFor, readActiveProject } from "@/lib/projects";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSettings, readSite } from "@/lib/store";

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
    return NextResponse.json({ error: "Ask a question or tell me what website to build for someone else." }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "That request is too long." }, { status: 400 });
  }

  const homeSite = await readSite();
  const activeProject = await readActiveProject();
  const settings = await readSettings();
  const result = await customizeSite({
    homeSite,
    activeProject,
    message,
    history: Array.isArray(body?.history) ? body.history.slice(-8) : [],
    settings,
  });
  if (result.project) revalidatePath(publicUrlFor(result.project.slug), "page");
  return NextResponse.json({
    reply: result.reply,
    site: result.homeSite,
    engine: result.engine,
    warning: result.warning,
    changed: result.changed,
    homeChanged: result.homeChanged,
    project: result.project
      ? {
          slug: result.project.slug,
          name: result.project.name,
          clientName: result.project.clientName,
          source: result.project.source,
          url: publicUrlFor(result.project.slug),
          site: result.project.site,
        }
      : null,
  });
}
