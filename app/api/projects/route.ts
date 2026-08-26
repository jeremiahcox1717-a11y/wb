import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { listProjects, publicUrlFor, readActiveProject, setActiveSlug } from "@/lib/projects";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) return unauthorized();
  const [projects, active] = await Promise.all([listProjects(), readActiveProject()]);
  return NextResponse.json({
    activeSlug: active?.slug ?? null,
    projects: projects.map((item) => ({ ...item, url: publicUrlFor(item.slug) })),
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) return unauthorized();
  const body = (await request.json().catch(() => null)) as { slug?: string } | null;
  const slug = body?.slug?.trim() ?? "";
  if (!slug) return NextResponse.json({ error: "Pick a site." }, { status: 400 });
  await setActiveSlug(slug);
  return NextResponse.json({ activeSlug: slug });
}
