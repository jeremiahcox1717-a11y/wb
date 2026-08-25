"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BusinessLead, HuntMode, HuntResult, PostcodeRecord, SavedLead, Settings } from "@/lib/types";

type Tab = "desk" | "saved" | "ledger";

const IG_TRADES = [
  "barber",
  "nails",
  "lashes",
  "beauty",
  "personal trainer",
  "cleaner",
  "plumber",
  "electrician",
  "dog groomer",
  "tattoo",
  "massage",
  "florist",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function kindLabel(kind: BusinessLead["kind"]) {
  if (kind === "ghost") return "No Google · no site";
  if (kind === "unclaimed") return "On Google · no site";
  if (kind === "instagram") return "Instagram only";
  return "Thin online";
}

function googleLabel(status: BusinessLead["google"]) {
  if (status === "not_found") return "Not on Google";
  if (status === "listed_no_website") return "Google listing, no website";
  if (status === "listed_with_website") return "Google + website";
  return "Google unchecked";
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function UnlistedApp() {
  const [tab, setTab] = useState<Tab>("desk");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [area, setArea] = useState("");
  const [manual, setManual] = useState("");
  const [mode, setMode] = useState<HuntMode>("all");
  const [radius, setRadius] = useState(900);
  const [googleKey, setGoogleKey] = useState("");
  const [current, setCurrent] = useState<PostcodeRecord | null>(null);
  const [used, setUsed] = useState<PostcodeRecord[]>([]);
  const [saved, setSaved] = useState<SavedLead[]>([]);
  const [hunt, setHunt] = useState<HuntResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [usedRes, leadsRes, settingsRes] = await Promise.all([
      fetch("/api/postcodes/used").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setUsed(usedRes.used ?? []);
    setSaved(leadsRes.leads ?? []);
    setSettings(settingsRes);
    setArea(settingsRes.lockedArea || "");
    setRadius(settingsRes.defaultRadius || 900);
  }, []);

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
    const stored = localStorage.getItem("unlisted-google-key");
    if (stored) setGoogleKey(stored);
  }, [refresh]);

  const instagramSearches = useMemo(() => {
    if (!current) return [];
    const place = current.district || current.area || current.outcode;
    return IG_TRADES.map((trade) => ({
      trade,
      href: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${place}" ${trade} (book OR booking OR "dm to book")`)}`,
    }));
  }, [current]);

  async function generate() {
    setError("");
    setBusy("next");
    try {
      const data = await readJson<{ postcode: PostcodeRecord }>(
        await fetch("/api/postcodes/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ area, country: settings?.defaultCountry ?? "uk" }),
        }),
      );
      setCurrent(data.postcode);
      setHunt(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a postcode.");
    } finally {
      setBusy(null);
    }
  }

  async function huntPostcode(postcode: string) {
    setError("");
    setBusy("hunt");
    try {
      const data = await readJson<HuntResult>(
        await fetch("/api/hunt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postcode,
            mode,
            radiusMeters: radius,
            googleKey,
            country: settings?.defaultCountry ?? "uk",
          }),
        }),
      );
      setCurrent(data.lookup);
      setHunt(data);
      await fetch("/api/postcodes/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: data.lookup.postcode, country: data.lookup.country }),
      });
      await refresh();
      setTab("desk");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hunt failed.");
    } finally {
      setBusy(null);
    }
  }

  async function saveLead(lead: BusinessLead) {
    const payload: SavedLead = {
      id: lead.id,
      name: lead.name,
      kind: lead.kind,
      category: lead.category,
      address: lead.address,
      postcode: lead.postcode,
      phone: lead.phone,
      instagram: lead.instagram,
      website: lead.website,
      notes: "",
      status: "new",
      savedAt: new Date().toISOString(),
    };
    const data = await readJson<{ leads: SavedLead[] }>(
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    setSaved(data.leads);
  }

  async function patchLead(id: string, patch: Partial<SavedLead>) {
    const data = await readJson<{ leads: SavedLead[] }>(
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      }),
    );
    setSaved(data.leads);
  }

  async function removeUsed(postcode: string) {
    const data = await readJson<{ used: PostcodeRecord[] }>(
      await fetch("/api/postcodes/used", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode }),
      }),
    );
    setUsed(data.used);
  }

  async function persistSettings(patch: Partial<Settings>) {
    const data = await readJson<Settings>(
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
    setSettings(data);
  }

  const savedIds = new Set(saved.map((row) => row.id));

  return (
    <main className="relative mx-auto min-h-screen max-w-[1320px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--gold)]">Private desk · Jordan only</p>
          <h1 className="stamp mt-2 text-5xl font-semibold italic md:text-7xl">Unlisted</h1>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            {greeting()}, Jordan. Feed it a postcode — or let it hand you one it has never given you before — and it will
            pull local businesses with no website, no Google profile, or Instagram pages that still have nowhere to book.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] p-1">
          {(["desk", "saved", "ledger"] as Tab[]).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm capitalize ${tab === id ? "bg-[var(--gold)] text-[#1a140c]" : "text-[var(--muted)]"}`}
            >
              {id === "desk" ? "Hunt desk" : id === "saved" ? `Saved ${saved.length}` : `Used ${used.length}`}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-2xl border border-[rgba(196,91,74,0.4)] bg-[rgba(196,91,74,0.12)] px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {tab === "desk" ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(22,19,16,0.82)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Postcode generator</p>
                <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={settings?.skipWholeOutcode ?? true}
                    onChange={(e) => persistSettings({ skipWholeOutcode: e.target.checked })}
                  />
                  Never reuse the same neighbourhood
                </label>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  onBlur={() => persistSettings({ lockedArea: area })}
                  placeholder="Lock to a city or area — Manchester, M1, Leeds..."
                  className="rounded-2xl border border-[var(--line)] bg-[#110f0c] px-4 py-3 outline-none focus:border-[var(--gold)]"
                />
                <button
                  onClick={generate}
                  disabled={busy === "next"}
                  className="rounded-2xl bg-[var(--gold)] px-5 py-3 font-medium text-[#1a140c] disabled:opacity-60"
                >
                  {busy === "next" ? "Finding…" : current ? "Next unused postcode" : "Give me a postcode"}
                </button>
                <select
                  value={settings?.defaultCountry ?? "uk"}
                  onChange={(e) => persistSettings({ defaultCountry: e.target.value as Settings["defaultCountry"] })}
                  className="rounded-2xl border border-[var(--line)] bg-[#110f0c] px-3 py-3"
                >
                  <option value="uk">UK</option>
                  <option value="us">US</option>
                </select>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                It remembers every code it has already handed you. Use this one, then hit next — it will not give you the same neighbourhood twice.
              </p>

              <div className="mt-8 min-h-[150px] rounded-[24px] border border-dashed border-[rgba(217,164,65,0.35)] bg-[rgba(217,164,65,0.05)] p-6">
                {current ? (
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Your next street</p>
                      <p className="stamp mt-1 text-5xl md:text-6xl">{current.postcode}</p>
                      <p className="mt-2 text-[var(--muted)]">
                        {[current.district, current.region, current.area].filter(Boolean).slice(0, 2).join(" · ") || current.outcode}
                      </p>
                    </div>
                    <button
                      onClick={() => huntPostcode(current.postcode)}
                      disabled={busy === "hunt"}
                      className="rounded-2xl border border-[var(--gold)] px-5 py-3 text-[var(--gold-2)]"
                    >
                      {busy === "hunt" ? "Hunting…" : "Hunt this postcode"}
                    </button>
                  </div>
                ) : (
                  <p className="stamp text-3xl italic text-[var(--muted)]">No postcode on the desk yet.</p>
                )}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manual.trim()) huntPostcode(manual);
                  }}
                  placeholder="Or type a postcode you already have"
                  className="rounded-2xl border border-[var(--line)] bg-[#110f0c] px-4 py-3 outline-none focus:border-[var(--gold)]"
                />
                <button
                  onClick={() => huntPostcode(manual)}
                  disabled={!manual.trim() || busy === "hunt"}
                  className="rounded-2xl bg-[#2a241c] px-5 py-3 disabled:opacity-50"
                >
                  Hunt this one
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(
                [
                  ["all", "Ghosts + Instagram"],
                  ["ghosts", "No website / no Google"],
                  ["instagram", "Instagram, no booking site"],
                ] as [HuntMode, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`rounded-full border px-4 py-2 text-sm ${mode === id ? "border-[var(--gold)] text-[var(--gold-2)]" : "border-[var(--line)] text-[var(--muted)]"}`}
                >
                  {label}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-3 text-sm text-[var(--muted)]">
                Radius {radius}m
                <input
                  type="range"
                  min={400}
                  max={2000}
                  step={100}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  onMouseUp={() => persistSettings({ defaultRadius: radius })}
                />
              </label>
            </div>

            {hunt ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="stamp text-3xl italic">Leads in {hunt.lookup.postcode}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      Scanned {hunt.scanned} local listings · {hunt.qualified} look underbuilt
                      {hunt.leads.length < hunt.qualified ? ` · showing the best ${hunt.leads.length}` : ""}
                      {hunt.googleEnabled ? " · Google profiles checked" : " · add a Google key below to auto-check profiles"}
                    </p>
                  </div>
                </div>
                {hunt.leads.length === 0 ? (
                  <p className="rounded-2xl border border-[var(--line)] p-6 text-[var(--muted)]">
                    Nothing thin showed up in this radius. Try Instagram searches on the right, widen the radius, or take the next postcode.
                  </p>
                ) : (
                  hunt.leads.map((lead) => (
                    <article key={lead.id} className="rounded-3xl border border-[var(--line)] bg-[rgba(22,19,16,0.7)] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">{kindLabel(lead.kind)}</p>
                          <h3 className="mt-1 text-2xl">{lead.name}</h3>
                          <p className="text-sm capitalize text-[var(--muted)]">
                            {lead.category}
                            {lead.address ? ` · ${lead.address}` : ""}
                            {lead.postcode ? ` · ${lead.postcode}` : ""}
                          </p>
                        </div>
                        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--gold-2)]">
                          Score {lead.score}
                        </span>
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        <li className="rounded-full bg-[#241c18] px-3 py-1 text-xs">{googleLabel(lead.google)}</li>
                        {lead.reasons.slice(0, 3).map((reason) => (
                          <li key={reason} className="rounded-full bg-[#1c1916] px-3 py-1 text-xs text-[var(--muted)]">
                            {reason}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm" href={lead.googleMapsUrl} target="_blank" rel="noreferrer">
                          Google Maps
                        </a>
                        <a
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
                          href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.postcode || hunt.lookup.postcode}`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Check Google profile
                        </a>
                        {lead.instagram ? (
                          <a
                            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
                            href={`https://www.instagram.com/${lead.instagram}/`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Instagram @{lead.instagram}
                          </a>
                        ) : (
                          <a
                            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
                            href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${lead.name}" ${lead.postcode || hunt.lookup.outcode}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Find Instagram
                          </a>
                        )}
                        {lead.phone ? (
                          <a className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm" href={`tel:${lead.phone}`}>
                            {lead.phone}
                          </a>
                        ) : null}
                        {lead.website ? (
                          <a className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm" href={lead.website} target="_blank" rel="noreferrer">
                            Current link
                          </a>
                        ) : null}
                        <button
                          onClick={() => saveLead(lead)}
                          disabled={savedIds.has(lead.id)}
                          className="rounded-full bg-[var(--gold)] px-3 py-1.5 text-sm text-[#1a140c] disabled:opacity-50"
                        >
                          {savedIds.has(lead.id) ? "Saved" : "Save for me"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-[var(--line)] bg-[rgba(22,19,16,0.82)] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Instagram with no booking site</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Local map data rarely carries Instagram handles. These searches find pages in this postcode that still say “DM to book”.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {current ? (
                  instagramSearches.map((item) => (
                    <a
                      key={item.trade}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm capitalize hover:border-[var(--gold)]"
                    >
                      {item.trade}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">Generate a postcode first.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--line)] bg-[rgba(22,19,16,0.82)] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Google profile check</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Optional. Paste a Google Maps API key with Places enabled and Unlisted will mark who has no profile, and who is on Google with no website.
              </p>
              <input
                type="password"
                value={googleKey}
                onChange={(e) => {
                  setGoogleKey(e.target.value);
                  localStorage.setItem("unlisted-google-key", e.target.value);
                }}
                placeholder="Google Maps API key"
                className="mt-4 w-full rounded-2xl border border-[var(--line)] bg-[#110f0c] px-4 py-3 outline-none"
              />
            </div>

            <div className="rounded-3xl border border-[var(--line)] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">How Jordan uses this</p>
              <ol className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <li>1. Lock a city if you want, or leave it open.</li>
                <li>2. Take a postcode. It is now used — it will not come up again.</li>
                <li>3. Hunt it. Save the ghosts. Check Instagram “DM to book” pages.</li>
                <li>4. Hit next unused postcode and keep walking the map.</li>
              </ol>
            </div>
          </aside>
        </section>
      ) : null}

      {tab === "saved" ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="stamp text-4xl italic">Your pocket</h2>
            {saved.length ? (
              <a
                className="text-sm text-[var(--gold)]"
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                  ["name,kind,category,postcode,phone,instagram,status,notes", ...saved.map((row) =>
                    [row.name, row.kind, row.category, row.postcode, row.phone, row.instagram, row.status, row.notes]
                      .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
                      .join(","),
                  )].join("\n"),
                )}`}
                download="unlisted-leads.csv"
              >
                Export CSV
              </a>
            ) : null}
          </div>
          {saved.length === 0 ? (
            <p className="text-[var(--muted)]">Nothing saved yet. Hunt a postcode and keep the ones worth calling.</p>
          ) : (
            saved.map((lead) => (
              <article key={lead.id} className="rounded-3xl border border-[var(--line)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">{kindLabel(lead.kind)}</p>
                    <h3 className="text-2xl">{lead.name}</h3>
                    <p className="text-sm text-[var(--muted)]">
                      {lead.category}
                      {lead.postcode ? ` · ${lead.postcode}` : ""}
                      {lead.phone ? ` · ${lead.phone}` : ""}
                      {lead.instagram ? ` · @${lead.instagram}` : ""}
                    </p>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => patchLead(lead.id, { status: e.target.value as SavedLead["status"] })}
                    className="rounded-full border border-[var(--line)] bg-transparent px-3 py-1"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="won">Won</option>
                    <option value="skip">Skip</option>
                  </select>
                </div>
                <textarea
                  value={noteId === lead.id ? lead.notes : lead.notes}
                  onFocus={() => setNoteId(lead.id)}
                  onChange={(e) => patchLead(lead.id, { notes: e.target.value })}
                  placeholder="Notes for you"
                  className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[#110f0c] px-3 py-2 text-sm"
                />
              </article>
            ))
          )}
        </section>
      ) : null}

      {tab === "ledger" ? (
        <section>
          <h2 className="stamp text-4xl italic">Used postcodes</h2>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Every code Unlisted has already given you. Restore one only if you want it back in the generator.
          </p>
          <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--line)]">
            {used.length === 0 ? (
              <p className="p-6 text-[var(--muted)]">The ledger is empty. Generate your first postcode.</p>
            ) : (
              used.map((row) => (
                <div key={row.postcode} className="ledger-row flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
                  <div>
                    <p className="stamp text-2xl">{row.postcode}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {row.district || row.area || row.outcode} · {new Date(row.issuedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => huntPostcode(row.postcode)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm">
                      Hunt again
                    </button>
                    <button onClick={() => removeUsed(row.postcode)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm">
                      Allow again
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
