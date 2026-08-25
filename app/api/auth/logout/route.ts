import { NextResponse } from "next/server";
import { clearSessionCookie, isSameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
