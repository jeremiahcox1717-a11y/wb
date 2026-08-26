import { NextResponse } from "next/server";
import { isSameOrigin, readSessionCookie, verifySessionToken } from "@/lib/auth";
import { entryIsEmpty, normalizeEntry } from "@/lib/notebook";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { addNotebookEntry, deleteNotebookEntry, readNotebook } from "@/lib/store";

export const runtime = "nodejs";

function unauthorized(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const blocked = unauthorized(request);
  if (blocked) return blocked;
  return NextResponse.json(await readNotebook());
}

export async function POST(request: Request) {
  const blocked = unauthorized(request);
  if (blocked) return blocked;
  const limited = rateLimit(`notebook:${clientKey(request)}`, 60, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Slow down a little, then try again." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    businessName?: string;
    phone?: string;
    email?: string;
  } | null;
  const entry = normalizeEntry(body ?? {});
  if (entryIsEmpty(entry)) {
    return NextResponse.json({ error: "Add a name, business, phone, or email." }, { status: 400 });
  }
  if (entry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }
  const notebook = await addNotebookEntry(entry);
  return NextResponse.json(notebook);
}

export async function DELETE(request: Request) {
  const blocked = unauthorized(request);
  if (blocked) return blocked;
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing entry id." }, { status: 400 });
  }
  const notebook = await deleteNotebookEntry(id);
  return NextResponse.json(notebook);
}
