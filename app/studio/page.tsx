import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StudioApp } from "@/components/studio-app";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { publicSettings, readSettings, readSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private studio",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    redirect("/studio/login");
  }
  const site = await readSite();
  const settings = publicSettings(await readSettings());
  return <StudioApp initialSite={site} hasKey={settings.hasKey} model={settings.model} />;
}
