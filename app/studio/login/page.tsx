import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/studio/login/actions";
import { isStudioConfigured, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio login",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  password: "Wrong password.",
  rate: "Too many attempts. Try later.",
  config: "Studio is locked until ADMIN_PASSWORD is set (8+ characters) on the server.",
};

export default async function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const jar = await cookies();
  if (verifySessionToken(jar.get(SESSION_COOKIE)?.value)) {
    redirect("/studio");
  }

  const { error } = await searchParams;
  const configured = isStudioConfigured();
  const message = error ? errors[error] : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111114] px-6 text-[#f4ece3]">
      <form action={loginAction} method="post" className="w-full max-w-sm">
        <p className="text-xs font-semibold tracking-[0.28em] text-[#d4a574] uppercase">Private studio</p>
        <h1 className="mt-4 font-serif text-4xl">Only you get in.</h1>
        <p className="mt-3 text-sm leading-6 text-[#b9a89a]">
          The public website is open to everyone. This room is not. Use the owner password from your server
          environment.
        </p>
        {!configured ? (
          <p className="mt-8 border border-[#3a3128] bg-[#1e1914] p-4 text-sm leading-6">
            Studio is locked until <code className="text-[#d4a574]">ADMIN_PASSWORD</code> is set (8+ characters) on
            the server. Nobody can claim it from the browser.
          </p>
        ) : (
          <>
            <label className="mt-8 block text-xs tracking-wide text-[#b9a89a] uppercase">
              Password
              <input
                id="studio-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full border border-[#3a3128] bg-[#1e1914] px-3 py-3 text-base text-[#f4ece3] outline-none focus:border-[#d4a574]"
              />
            </label>
            {message ? <p className="mt-3 text-sm text-[#e8a0a0]">{message}</p> : null}
            <button
              id="studio-login-submit"
              type="submit"
              className="mt-6 w-full bg-[#d4a574] py-3 text-sm font-semibold text-[#1a140f]"
            >
              Open studio
            </button>
          </>
        )}
      </form>
    </main>
  );
}
