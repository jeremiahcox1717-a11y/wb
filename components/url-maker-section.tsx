"use client";

import { FormEvent, useState } from "react";
import { generateUrl } from "@/lib/url-guard";

export function UrlMakerSection({ heading, body }: { heading?: string; body?: string }) {
  const [name, setName] = useState("");
  const [made, setMade] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const generated = generateUrl(name);
    if (!generated.ok) {
      setError(generated.error);
      setMade("");
      return;
    }
    setError("");
    setMade(generated.url);
    setCopied(false);
  }

  async function copy() {
    if (!made) return;
    try {
      await navigator.clipboard.writeText(made);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      id="url-maker"
      className="p-4 md:p-5"
      style={{
        background: "var(--wb-surface)",
        border: "1px solid var(--wb-border)",
        borderRadius: "var(--wb-radius)",
      }}
    >
      {heading ? (
        <h3 className="text-xl" style={{ fontFamily: "var(--wb-display)" }}>
          {heading}
        </h3>
      ) : null}
      <p className="mt-1 text-sm leading-5" style={{ color: "var(--wb-muted)" }}>
        {body || "Type a name. I’ll turn it into a .com address, like jordanbennett.com."}
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="page-url-make">
          Name to turn into a .com URL
        </label>
        <input
          id="page-url-make"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jordan Bennett"
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--wb-bg)",
            border: "1px solid var(--wb-border)",
            color: "var(--wb-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        />
        <button
          id="page-url-make-submit"
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--wb-accent)",
            color: "var(--wb-accent-text)",
            borderRadius: "var(--wb-radius-btn)",
          }}
        >
          Make .com
        </button>
      </form>
      {error ? <p className="mt-2 text-sm">{error}</p> : null}
      {made ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p id="page-url-made-value" className="min-w-0 flex-1 break-all text-lg" style={{ fontFamily: "var(--wb-display)" }}>
            {made}
          </p>
          <button
            id="page-url-make-copy"
            type="button"
            onClick={() => void copy()}
            className="px-3 py-2 text-xs font-semibold"
            style={{
              border: "1px solid var(--wb-border)",
              borderRadius: "var(--wb-radius-btn)",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
