"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { SiteView } from "@/components/site-view";
import type { Site } from "@/lib/schema";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's the time?",
  "What can you do?",
  "Make the heading Jordan Bennett",
  "Use the copper palette",
  "Add an FAQ, keep everything else",
  "My email is hello@example.com",
];

export function StudioApp({
  initialSite,
  hasKey,
  model,
}: {
  initialSite: Site;
  hasKey: boolean;
  model: string;
}) {
  const [site, setSite] = useState(initialSite);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Ask me anything, or tell me what this private site should be. Questions get answers. Any customization you ask for is applied on the page.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState(hasKey);
  const [settingsModel, setSettingsModel] = useState(model);
  const [notice, setNotice] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const home = useMemo(
    () => site.pages.find((page) => page.slug === "/") ?? site.pages[0],
    [site],
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput("");
    const history = [...turns, { role: "user" as const, content: trimmed }];
    setTurns(history);
    try {
      const response = await fetch("/api/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: turns }),
      });
      const data = (await response.json()) as {
        error?: string;
        reply?: string;
        site?: Site;
        engine?: string;
        warning?: string;
        changed?: boolean;
      };
      if (!response.ok) {
        setTurns((current) => [...current, { role: "assistant", content: data.error || "That did not work." }]);
        return;
      }
      if (data.site && data.changed !== false) setSite(data.site);
      const suffix = data.engine === "local" && data.changed && !savedKey ? " (built-in designer — add a key in Settings for a full language model.)" : "";
      const warning = data.warning ? ` ${data.warning}` : "";
      setTurns((current) => [
        ...current,
        { role: "assistant", content: `${data.reply || "Updated."}${suffix}${warning}` },
      ]);
    } catch {
      setTurns((current) => [...current, { role: "assistant", content: "Network error while publishing." }]);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await send(input);
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settingsModel,
        provider: "openai",
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      }),
    });
    const data = (await response.json()) as { error?: string; hasKey?: boolean };
    if (!response.ok) {
      setNotice(data.error || "Could not save settings.");
      return;
    }
    setSavedKey(Boolean(data.hasKey));
    setApiKey("");
    setNotice("Saved. New messages will use this key. It is never shown on the site.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/studio/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e12] text-[#f3eee8]">
      <aside className="flex w-full max-w-[28rem] shrink-0 flex-col border-r border-[#2a2a32]">
        <header className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-[#d4a574] uppercase">Owner studio</p>
            <p className="mt-1 text-sm text-[#b9a89a]">Ask questions or rebuild the site</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              className="border border-[#2a2a32] px-3 py-1.5 text-xs"
            >
              Settings
            </button>
            <button type="button" onClick={logout} className="border border-[#2a2a32] px-3 py-1.5 text-xs">
              Lock
            </button>
          </div>
        </header>

        {settingsOpen ? (
          <form onSubmit={saveSettings} className="space-y-3 border-b border-[#2a2a32] px-5 py-4 text-sm">
            <p className="text-[#b9a89a]">
              Optional language-model key. Stored only on this server, never committed, never shown on the site.
              Without a key, the built-in designer still saves immediately.
            </p>
            <label className="block text-xs tracking-wide text-[#b9a89a] uppercase">
              OpenAI-compatible API key
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={savedKey ? "Key on file — paste to replace" : "sk-…"}
                className="mt-2 w-full border border-[#2a2a32] bg-[#16161c] px-3 py-2 outline-none"
              />
            </label>
            <label className="block text-xs tracking-wide text-[#b9a89a] uppercase">
              Model
              <input
                value={settingsModel}
                onChange={(event) => setSettingsModel(event.target.value)}
                className="mt-2 w-full border border-[#2a2a32] bg-[#16161c] px-3 py-2 outline-none"
              />
            </label>
            {notice ? <p className="text-xs text-[#d4a574]">{notice}</p> : null}
            <button type="submit" className="bg-[#d4a574] px-3 py-2 text-xs font-semibold text-[#1a140f]">
              Save key
            </button>
          </form>
        ) : null}

        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {turns.map((turn, index) => (
            <div key={index} className={turn.role === "user" ? "ml-8" : "mr-4"}>
              <p className="text-[10px] tracking-[0.2em] text-[#7d7368] uppercase">
                {turn.role === "user" ? "You" : "Designer"}
              </p>
              <p
                className="mt-1 whitespace-pre-wrap text-sm leading-6"
                style={{ color: turn.role === "user" ? "#f3eee8" : "#d7cdc2" }}
              >
                {turn.content}
              </p>
            </div>
          ))}
          {busy ? <p className="text-xs tracking-wide text-[#d4a574] uppercase">Working…</p> : null}
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              id={item.startsWith("Turn this into a bakery") ? "suggestion-bakery" : undefined}
              disabled={busy}
              onClick={() => send(item)}
              className="border border-[#2a2a32] px-2 py-1 text-left text-[11px] leading-4 text-[#b9a89a] hover:border-[#d4a574] hover:text-[#f3eee8]"
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="border-t border-[#2a2a32] p-4">
          <textarea
            id="studio-prompt"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={3}
            placeholder="Ask a question, or make it a restaurant named Supper House…"
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#5c564e]"
          />
          <div className="mt-3 flex items-center justify-between">
            <a href="/" target="_blank" rel="noreferrer" className="text-xs text-[#b9a89a] underline">
              Open your site
            </a>
            <button
              id="studio-publish"
              type="submit"
              disabled={busy || !input.trim()}
              className="bg-[#d4a574] px-4 py-2 text-xs font-semibold text-[#1a140f] disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </aside>

      <section className="relative hidden min-w-0 flex-1 overflow-hidden lg:block">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[11px] tracking-wide text-[#d4a574] uppercase backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7dffb3]" />
          Live preview · private
        </div>
        <div className="h-screen overflow-y-auto">
          {home ? <SiteView site={site} page={home} preview /> : null}
        </div>
      </section>
    </div>
  );
}
