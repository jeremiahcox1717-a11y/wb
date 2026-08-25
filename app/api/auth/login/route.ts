import { NextResponse } from "next/server";
import {
  createSessionToken,
  isSameOrigin,
  isStudioConfigured,
  passwordsMatch,
  sessionCookie,
} from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isStudioConfigured()) {
    return NextResponse.json(
      { error: "Studio is not configured. Set ADMIN_PASSWORD (8+ characters) on the server." },
      { status: 503 },
    );
  }

  const limited = rateLimit(`login:${clientKey(request)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";
  if (!passwordsMatch(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", sessionCookie(createSessionToken()));
  return response;
}
