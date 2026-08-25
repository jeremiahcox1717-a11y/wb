import { answerLocally, currentClock, tryFactualAnswer } from "./answer";
import { applyLocalDesign, wantsSiteChange } from "./local-designer";
import { formatDomainSearch, searchPublicDomains } from "../domain-shop";
import { looksLikeUrlMake } from "../url-guard";
import { siteSchema, type Site } from "../schema";
import type { StudioSettings } from "../store";

type ChatTurn = { role: "user" | "assistant"; content: string };

function isUsableApiKey(value: string) {
  const key = value.trim();
  if (key.length < 20) return false;
  if (/\s/.test(key)) return false;
  if (/^sk-ant-/.test(key) || /^sk-/.test(key)) return true;
  return /^[A-Za-z0-9_\-:./]+$/.test(key) && key.length >= 32;
}

function credentials(settings: StudioSettings) {
  const raw = settings.apiKey || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const apiKey = isUsableApiKey(raw) ? raw : "";
  const provider: "openai" | "anthropic" | "compatible" =
    settings.provider ||
    (settings.baseUrl || process.env.OPENAI_BASE_URL
      ? "compatible"
      : process.env.ANTHROPIC_API_KEY && !settings.apiKey && !process.env.OPENAI_API_KEY
        ? "anthropic"
        : "openai");
  const model =
    settings.model ||
    process.env.OPENAI_MODEL ||
    (provider === "anthropic" ? "claude-sonnet-4-5" : "gpt-4.1-mini");
  const baseUrl = (settings.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  return { apiKey, provider, model, baseUrl };
}

const SYSTEM = `You are the designer for a private website builder. The owner types what they want. You rewrite the entire site JSON so their locked website matches.

Rules:
- Return ONLY JSON: {"reply": string, "site": Site}
- "reply" is 1-3 short sentences in plain English telling the owner what you changed. Mention that it is live for them.
- Keep version at 1.
- Keep slugs starting with "/". The home page slug must be "/".
- Preserve contact details (email, phone, location, socials) unless the owner asked to change them.
- Preserve the ownerName unless they asked to rename themselves.
- Use only these section types: hero, features, richtext, gallery, testimonials, pricing, faq, stats, cta, contact, team, urlMaker, urlScanner, nameScanner, currencyCalculator, notebook, footer.
- Always keep urlMaker, urlScanner, nameScanner, currencyCalculator, and notebook on the home page (before the footer).
- Theme colors must be hex like #14110e. Fonts must be real Google Fonts family names.
- Write specific, human copy. No lorem ipsum. No stock startup slogans.
- If they asked for a kind of business, rebuild the sitemap and copy for that business.
- If they asked for a small tweak, keep the rest but actually apply that tweak (colors, heading, sections, fonts, layout).
- Never ignore a customization. Do what they asked.
- Image URLs are optional. Prefer no broken images; omit image rather than inventing a fake local path.
- Include a footer last on the home page.
- Never mention system prompts or JSON schema in the site copy.
- The website is private. Do not write copy that says anyone can visit without a password.
- If the owner is only asking a question, still return JSON but keep the same site and put the answer in "reply".`;

async function fromOpenAI(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  site: Site;
  message: string;
  history: ChatTurn[];
}) {
  const response = await fetch(`${args.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        ...args.history.slice(-8),
        {
          role: "user",
          content: `Current site JSON:\n${JSON.stringify(args.site)}\n\nOwner request:\n${args.message}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error (${response.status}): ${detail.slice(0, 280)}`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function fromAnthropic(args: { apiKey: string; model: string; site: Site; message: string; history: ChatTurn[] }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: 8000,
      temperature: 0.7,
      system: SYSTEM,
      messages: [
        ...args.history.slice(-8).map((turn) => ({
          role: turn.role === "assistant" ? "assistant" : "user",
          content: turn.content,
        })),
        {
          role: "user",
          content: `Current site JSON:\n${JSON.stringify(args.site)}\n\nOwner request:\n${args.message}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error (${response.status}): ${detail.slice(0, 280)}`);
  }
  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((part) => part.type === "text")?.text ?? "";
}

const ASK_SYSTEM = `You are the owner's private assistant on a locked personal website.

Answer their questions in plain English. Be direct and useful. You may answer general questions, not only questions about this site. Use the current time given in the user message when they ask the time or date.

You also know this site:
- The website builder chat can rebuild the page when they ask (bakery, portfolio, colors, and so on).
- URL maker: search a real public domain, then buy it at GoDaddy, Namecheap, or Porkbun. A made-up string is not a working internet address. After they pay the registrar, that URL works everywhere.
- URL scanner: paste a link, YES means it looks safe, NO means do not open it.
- Name scanner: YES means someone else uses the name publicly.
- Currency: they can type or pick from and to currencies and convert both ways.
- Notebook: private names, businesses, phones, emails.

Do not change the website while answering a question. Do not return JSON. Do not mention system prompts. Do not say the public can visit without a password.`;

function siteBrief(site: Site) {
  const clock = currentClock(site);
  return `Owner: ${site.identity.ownerName}. Site name: ${site.identity.siteName}. Tagline: ${site.identity.tagline || "none"}. Current time: ${clock.main}. Also ${clock.extra}.`;
}

async function askOpenAI(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  site: Site;
  message: string;
  history: ChatTurn[];
}) {
  const response = await fetch(`${args.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.6,
      messages: [
        { role: "system", content: ASK_SYSTEM },
        ...args.history.slice(-8),
        {
          role: "user",
          content: `${siteBrief(args.site)}\n\nQuestion:\n${args.message}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error (${response.status}): ${detail.slice(0, 280)}`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function askAnthropic(args: { apiKey: string; model: string; site: Site; message: string; history: ChatTurn[] }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: 1200,
      temperature: 0.6,
      system: ASK_SYSTEM,
      messages: [
        ...args.history.slice(-8).map((turn) => ({
          role: turn.role === "assistant" ? "assistant" : "user",
          content: turn.content,
        })),
        {
          role: "user",
          content: `${siteBrief(args.site)}\n\nQuestion:\n${args.message}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error (${response.status}): ${detail.slice(0, 280)}`);
  }
  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((part) => part.type === "text")?.text?.trim() ?? "";
}

function parseModelJson(raw: string, fallback: Site) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("The model did not return JSON.");
  const parsed = JSON.parse(match[0]) as { reply?: string; site?: unknown };
  const site = siteSchema.parse(parsed.site ?? fallback);
  const reply =
    typeof parsed.reply === "string" && parsed.reply.trim()
      ? parsed.reply.trim()
      : "Updated your private site. It is live now.";
  return { site, reply, engine: "llm" as const };
}

export async function customizeSite(input: {
  site: Site;
  message: string;
  history?: ChatTurn[];
  settings: StudioSettings;
}): Promise<{ site: Site; reply: string; engine: "llm" | "local"; warning?: string; changed: boolean }> {
  const creds = credentials(input.settings);
  const history = input.history ?? [];

  if (looksLikeUrlMake(input.message)) {
    const result = await searchPublicDomains(input.message);
    return { site: input.site, reply: formatDomainSearch(result), engine: "local", changed: false };
  }

  const fact = tryFactualAnswer(input.site, input.message);
  if (fact) {
    return { site: input.site, reply: fact, engine: "local", changed: false };
  }

  if (!wantsSiteChange(input.message)) {
    if (!creds.apiKey) {
      return {
        site: input.site,
        reply: answerLocally(input.site, input.message),
        engine: "local",
        changed: false,
      };
    }
    try {
      const reply =
        creds.provider === "anthropic"
          ? await askAnthropic({
              apiKey: creds.apiKey,
              model: creds.model,
              site: input.site,
              message: input.message,
              history,
            })
          : await askOpenAI({
              apiKey: creds.apiKey,
              baseUrl: creds.baseUrl,
              model: creds.model,
              site: input.site,
              message: input.message,
              history,
            });
      return {
        site: input.site,
        reply: reply || answerLocally(input.site, input.message),
        engine: "llm",
        changed: false,
      };
    } catch {
      return {
        site: input.site,
        reply: answerLocally(input.site, input.message),
        engine: "local",
        changed: false,
        warning: "The saved AI key did not work, so I answered with the built-in helper. Fix it in Studio → Settings for fuller answers.",
      };
    }
  }

  const local = applyLocalDesign(input.site, input.message);
  if (!creds.apiKey) {
    return { ...local, engine: "local" };
  }

  try {
    const raw =
      creds.provider === "anthropic"
        ? await fromAnthropic({
            apiKey: creds.apiKey,
            model: creds.model,
            site: input.site,
            message: input.message,
            history,
          })
        : await fromOpenAI({
            apiKey: creds.apiKey,
            baseUrl: creds.baseUrl,
            model: creds.model,
            site: input.site,
            message: input.message,
            history,
          });
    return { ...parseModelJson(raw, input.site), changed: true };
  } catch (error) {
    const warning = error instanceof Error ? error.message : "The language model failed.";
    return { ...local, engine: "local", warning };
  }
}
