"use client";

import { FormEvent, useState } from "react";

export function StudioLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Could not sign in.");
        setPending(false);
        return;
      }
      // Full navigation so the httpOnly session cookie is sent to /studio.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/studio");
    } catch {
      setError("Network error.");
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111114] px-6 text-[#f4ece3]">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full border border-[#3a3128] bg-[#1e1914] px-3 py-3 text-base text-[#f4ece3] outline-none focus:border-[#d4a574]"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-[#e8a0a0]">{error}</p> : null}
            <button
              id="studio-login-submit"
              type="submit"
              disabled={pending}
              className="mt-6 w-full bg-[#d4a574] py-3 text-sm font-semibold text-[#1a140f] disabled:opacity-60"
            >
              {pending ? "Opening…" : "Open studio"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
