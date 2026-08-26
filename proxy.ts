import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

function isPublicPath(pathname: string) {
  if (pathname === "/studio/login") return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname === "/robots.txt" || pathname === "/favicon.ico") return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/studio/login";
  login.search = "";
  const next = `${pathname}${request.nextUrl.search}`;
  if (next && next !== "/studio/login") {
    login.searchParams.set("next", next);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
