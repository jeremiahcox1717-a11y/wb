import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StudioLogin } from "@/components/studio-login";
import { isStudioConfigured, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio login",
  robots: { index: false, follow: false },
};

export default async function StudioLoginPage() {
  const jar = await cookies();
  if (verifySessionToken(jar.get(SESSION_COOKIE)?.value)) {
    redirect("/studio");
  }
  return <StudioLogin configured={isStudioConfigured()} />;
}
