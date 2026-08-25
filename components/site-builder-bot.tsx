"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { looksLikeMoney, parseMoney } from "@/lib/currency";
import type { Site } from "@/lib/schema";
import { extractUrl, formatAnswer, looksLikeUrlQuestion, type UrlScan } from "@/lib/url-guard";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["What's the time?", "What can you do?", "Build a bakery site"];

export function SiteBuilderBot({ onSite }: { onSite: (site: Site) => void }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content: "Ask me anything — what’s the time, a question, or what to build. I can also scan a URL or convert money.",
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
      if (looksLikeMoney(trimmed) && parseMoney(trimmed)) {
        const response = await fetch("/api/currency/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        const data = (await response.json()) as { error?: string; summary?: string };
        if (!response.ok) {
          setTurns((current) => [...current, { role: "assistant", content: data.error || "I could not convert that." }]);
          return;
        }
        setTurns((current) => [...current, { role: "assistant", content: data.summary || "Converted." }]);
        return;
      }

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
        changed?: boolean;
      };
      if (!response.ok) {
        setTurns((current) => [...current, { role: "assistant", content: data.error || "That did not work." }]);
        return;
      }
      if (data.site && data.changed) onSite(data.site);
      const suffix = data.engine === "local" && data.changed ? " You can add an AI key in Studio → Settings for a full language model." : "";
      const warning = data.warning ? ` ${data.warning}` : "";
      setTurns((current) => [
        ...current,
        { role: "assistant", content: `${data.reply || "Done."}${suffix}${warning}` },
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
      <header className="flex items-center gap-2 border-b border-[#2a2a32] px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f2f0] text-[11px] font-semibold text-[#111111]">
          AI
        </span>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.24em] text-[#f2f2f0] uppercase">Website builder</p>
          <p className="text-xs text-[#a3a39b]">{busy ? "Working…" : "Ask a question or tell me what to build"}</p>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "ml-6" : "mr-4"}>
            <p className="text-[10px] tracking-[0.2em] text-[#7d7d7d] uppercase">
              {turn.role === "user" ? "You" : "Builder bot"}
            </p>
            <p
              className="mt-0.5 whitespace-pre-wrap text-sm leading-5"
              style={{ color: turn.role === "user" ? "#f3f3f1" : "#c8c8c4" }}
            >
              {turn.content}
            </p>
          </div>
        ))}
        {busy ? (
          <p className="text-[10px] tracking-wide text-[#f2f2f0] uppercase">Working…</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            id={
              item.includes("bakery")
                ? "builder-suggestion-bakery"
                : item.toLowerCase().includes("time")
                  ? "builder-suggestion-time"
                  : item.includes("What can you")
                    ? "builder-suggestion-ask"
                    : undefined
            }
            disabled={busy}
            onClick={() => send(item)}
            className="border border-[#2a2a32] px-2 py-0.5 text-left text-[11px] leading-4 text-[#a3a39b] hover:border-[#f2f2f0] hover:text-[#f3f3f1] disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-[#2a2a32] p-2">
        <label className="sr-only" htmlFor="builder-bot-input">
          Tell the bot a question or what website to build
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
          rows={1}
          placeholder="What’s the time? Or build me a bakery website…"
          className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-[#5c564e]"
        />
        <button
          id="builder-bot-send"
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 bg-[#f2f2f0] px-3 py-1.5 text-xs font-semibold text-[#111111] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
