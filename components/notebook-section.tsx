"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { NotebookEntry } from "@/lib/notebook";

export function NotebookSection({ heading, body }: { heading?: string; body?: string }) {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch("/api/notebook")
      .then((response) => (response.ok ? response.json() : { entries: [] }))
      .then((data: { entries?: NotebookEntry[] }) => {
        if (!ignore) setEntries(Array.isArray(data.entries) ? data.entries : []);
      })
      .catch(() => {
        if (!ignore) setEntries([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      [entry.name, entry.businessName, entry.phone, entry.email].join(" ").toLowerCase().includes(needle),
    );
  }, [entries, query]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, businessName, phone, email }),
      });
      const data = (await response.json()) as { error?: string; entries?: NotebookEntry[] };
      if (!response.ok) {
        setError(data.error || "Could not save that.");
        return;
      }
      setEntries(data.entries ?? []);
      setName("");
      setBusinessName("");
      setPhone("");
      setEmail("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/notebook?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) return;
    const data = (await response.json()) as { entries?: NotebookEntry[] };
    setEntries(data.entries ?? []);
  }

  const fieldStyle = {
    background: "var(--wb-bg)",
    border: "1px solid var(--wb-border)",
    color: "var(--wb-text)",
    borderRadius: "var(--wb-radius-btn)",
  } as const;

  return (
    <div
      className="p-6 md:p-8"
      style={{
        background: "var(--wb-surface)",
        border: "1px solid var(--wb-border)",
        borderRadius: "var(--wb-radius)",
      }}
    >
      {heading ? (
        <h3 className="text-2xl" style={{ fontFamily: "var(--wb-display)" }}>
          {heading}
        </h3>
      ) : null}
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--wb-muted)" }}>
        {body || "Save a person’s name, business, phone number, and email. Only you can see this list."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3 md:grid-cols-2">
        <label className="text-xs tracking-wide uppercase" style={{ color: "var(--wb-muted)" }}>
          Name
          <input
            id="notebook-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full px-3 py-3 text-base outline-none"
            style={fieldStyle}
          />
        </label>
        <label className="text-xs tracking-wide uppercase" style={{ color: "var(--wb-muted)" }}>
          Business name
          <input
            id="notebook-business"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className="mt-1 w-full px-3 py-3 text-base outline-none"
            style={fieldStyle}
          />
        </label>
        <label className="text-xs tracking-wide uppercase" style={{ color: "var(--wb-muted)" }}>
          Number
          <input
            id="notebook-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full px-3 py-3 text-base outline-none"
            style={fieldStyle}
          />
        </label>
        <label className="text-xs tracking-wide uppercase" style={{ color: "var(--wb-muted)" }}>
          Email
          <input
            id="notebook-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full px-3 py-3 text-base outline-none"
            style={fieldStyle}
          />
        </label>
        <div className="md:col-span-2">
          <button
            id="notebook-save"
            type="submit"
            disabled={busy}
            className="px-5 py-3 text-sm font-semibold disabled:opacity-50"
            style={{
              background: "var(--wb-accent)",
              color: "var(--wb-accent-text)",
              borderRadius: "var(--wb-radius-btn)",
            }}
          >
            {busy ? "Saving…" : "Save to notebook"}
          </button>
        </div>
      </form>
      {error ? <p className="mt-3 text-sm">{error}</p> : null}

      <label className="mt-8 block text-xs tracking-wide uppercase" style={{ color: "var(--wb-muted)" }}>
        Search
        <input
          id="notebook-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a name, business, number, or email"
          className="mt-1 w-full px-3 py-3 text-base outline-none"
          style={fieldStyle}
        />
      </label>

      <ul id="notebook-list" className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <li className="text-sm" style={{ color: "var(--wb-muted)" }}>
            {entries.length === 0 ? "No people saved yet." : "No matches."}
          </li>
        ) : (
          visible.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-4 p-4"
              style={{ border: "1px solid var(--wb-border)", borderRadius: "var(--wb-radius)" }}
            >
              <div>
                <p className="text-lg" style={{ fontFamily: "var(--wb-display)" }}>
                  {entry.name || "No name"}
                </p>
                {entry.businessName ? <p className="text-sm">{entry.businessName}</p> : null}
                {entry.phone ? (
                  <p className="mt-1 text-sm" style={{ color: "var(--wb-muted)" }}>
                    {entry.phone}
                  </p>
                ) : null}
                {entry.email ? (
                  <p className="text-sm" style={{ color: "var(--wb-muted)" }}>
                    {entry.email}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void remove(entry.id)}
                className="text-xs underline"
                style={{ color: "var(--wb-muted)" }}
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
