"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, isStudioConfigured, passwordsMatch, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function loginAction(formData: FormData) {
  if (!isStudioConfigured()) {
    redirect("/studio/login?error=config");
  }

  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const limited = rateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    redirect("/studio/login?error=rate");
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordsMatch(password)) {
    redirect("/studio/login?error=password");
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/studio");
}
