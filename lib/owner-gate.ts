import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionCookie, safeNextPath, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function requireOwnerPage(nextPath = "/") {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(SESSION_COOKIE)?.value)) {
    const next = safeNextPath(nextPath);
    redirect(`/studio/login?next=${encodeURIComponent(next)}`);
  }
}

export function isOwnerRequest(request: Request) {
  return verifySessionToken(readSessionCookie(request.headers.get("cookie")));
}
