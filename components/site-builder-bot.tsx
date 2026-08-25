"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/schema";
import { extractUrl, formatAnswer, looksLikeUrlQuestion, type UrlScan } from "@/lib/url-guard";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Build me a bakery website called Hearth & Crumb",
  "Make a photographer portfolio",
  "Rebuild this as a restaurant",
  "Turn it into a coffee shop with ocean colors",
];

export function SiteBuilderBot({ onSite }: { onSite: (site: Site) => void }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Hi — I am your website builder. Tell me what to build, or paste a URL someone sent you and I will answer YES or NO.",
    },
  ]);
  const scroller = useRef<HTMLDivElement>(null);

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
      if (looksLikeUrlQuestion(trimmed) && extractUrl(trimmed)) {
        const response = await fetch("/api/urls/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: extractUrl(trimmed) }),
        });
        const data = (await response.json()) as UrlScan & { error?: string };
        if (!response.ok) {
          setTurns((current) => [...current, { role: "assistant", content: data.error || "I could not scan that URL." }]);
          return;
        }
        setTurns((current) => [...current, { role: "assistant", content: formatAnswer(data) }]);
        return;
      }

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
      };
      if (!response.ok) {
        setTurns((current) => [...current, { role: "assistant", content: data.error || "That did not work." }]);
        return;
      }
      if (data.site) onSite(data.site);
      const suffix = data.engine === "local" ? " You can add an AI key in Studio → Settings for a full language model." : "";
      const warning = data.warning ? ` ${data.warning}` : "";
      setTurns((current) => [
        ...current,
        { role: "assistant", content: `${data.reply || "Done — look at the site."}${suffix}${warning}` },
      ]);
    } catch {
      setTurns((current) => [...current, { role: "assistant", content: "Network error. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await send(input);
  }

  return (
    <div id="builder-bot" className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-[#2a2a32] px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a574] text-sm font-semibold text-[#1a140f]">
          AI
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-[#d4a574] uppercase">Website builder</p>
          <p className="text-sm text-[#b9a89a]">{busy ? "Building your site…" : "Tell me what to build"}</p>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "ml-6" : "mr-4"}>
            <p className="text-[10px] tracking-[0.2em] text-[#7d7368] uppercase">
              {turn.role === "user" ? "You" : "Builder bot"}
            </p>
            <p
              className="mt-1 whitespace-pre-wrap text-sm leading-6"
              style={{ color: turn.role === "user" ? "#f3eee8" : "#d7cdc2" }}
            >
              {turn.content}
            </p>
          </div>
        ))}
        {busy ? (
          <p className="text-xs tracking-wide text-[#d4a574] uppercase">Rebuilding the website…</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            id={item.includes("bakery") ? "builder-suggestion-bakery" : undefined}
            disabled={busy}
            onClick={() => send(item)}
            className="border border-[#2a2a32] px-2 py-1 text-left text-[11px] leading-4 text-[#b9a89a] hover:border-[#d4a574] hover:text-[#f3eee8] disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="border-t border-[#2a2a32] p-3">
        <label className="sr-only" htmlFor="builder-bot-input">
          Tell the bot what website to build
        </label>
        <textarea
          id="builder-bot-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
          rows={3}
          placeholder="Build me a bakery website…"
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#5c564e]"
        />
        <div className="mt-2 flex justify-end">
          <button
            id="builder-bot-send"
            type="submit"
            disabled={busy || !input.trim()}
            className="bg-[#d4a574] px-4 py-2 text-xs font-semibold text-[#1a140f] disabled:opacity-50"
          >
            Build it
          </button>
        </div>
      </form>
    </div>
  );
}
