import { NextResponse } from "next/server";
import { readSessionCookie, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!verifySessionToken(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
