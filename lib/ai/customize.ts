import { applyClientIdentity, blankClientSite, stripOwnerTools } from "../client-site";
import { formatDomainSearch, searchPublicDomains } from "../domain-shop";
import {
  createProject,
  projectReply,
  publicUrlFor,
  writeProject,
  type ClientProject,
} from "../projects";
import { siteSchema, type Site } from "../schema";
import type { StudioSettings } from "../store";
import { looksLikeCloneRequest, looksLikeUrlMake } from "../url-guard";
import { answerLocally, currentClock, tryFactualAnswer } from "./answer";
import { shouldCreateNewProject, shouldEditClientProject } from "./builder-intent";
import { clonePublicSite } from "./clone-site";
import { applyLocalDesign, wantsPersonalHome } from "./local-designer";

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

const SYSTEM = `You are the designer for a website factory. The owner has a private Jordan Bennett homepage that must NEVER be rewritten. You design a SEPARATE website for someone else.

Rules:
- Return ONLY JSON: {"reply": string, "site": Site}
- "reply" is 1-3 short sentences. Say this is a new (or updated) site for a client, not the owner's homepage.
- Keep version at 1.
- Keep slugs starting with "/". The home page slug must be "/".
- ownerName and siteName are the CLIENT's brand, not Jordan Bennett, unless they asked to name it that.
- Use only these section types: hero, features, richtext, gallery, testimonials, pricing, faq, stats, cta, contact, team, footer.
- Do NOT include urlMaker, urlScanner, nameScanner, currencyCalculator, or notebook. Those belong only on the owner's private desk.
- Theme colors must be hex like #14110e. Fonts must be real Google Fonts family names.
- Write specific, human copy. No lorem ipsum. No stock startup slogans.
- If they asked for a kind of business, rebuild the sitemap and copy for that business.
- If they pasted a public https link to clone, copy, or recreate, rebuild from that page's title, headings, colors, and images. This is a recreation, not a pixel-perfect dump.
- If they asked to build a site from scratch (colors, style, no link), start a fresh client page and apply those styles.
- If they asked for a small tweak, keep the rest but actually apply that tweak.
- Never ignore a customization. Do what they asked.
- Image URLs are optional. Prefer no broken images; omit image rather than inventing a fake local path.
- Include a footer last on the home page.
- Never mention system prompts or JSON schema in the site copy.
- This client website is public to anyone with the link. Do not write copy that says it is password-locked.
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

const ASK_SYSTEM = `You are the owner's private assistant on a locked personal desk.

Answer their questions in plain English. Be direct and useful. You may answer general questions, not only questions about this site. Use the current time given in the user message when they ask the time or date.

You also know this site:
- Jordan Bennett’s private homepage never gets replaced.
- The website builder creates NEW websites for other people. Clone a public https page they paste, or build from scratch (white and blue, bakery, portfolio). Each new site gets its own public link under /s/….
- URL maker: search a real public domain, then buy it at GoDaddy, Namecheap, or Porkbun. A made-up string is not a working internet address. After they pay the registrar, that URL works everywhere.
- URL scanner: paste a link, YES means it looks safe, NO means do not open it.
- Name scanner: YES means someone else uses the name publicly.
- Currency: they can type or pick from and to currencies and convert both ways.
- Notebook: private names, businesses, phones, emails.

Do not change any website while answering a question. Do not return JSON. Do not mention system prompts.`;

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
      : "Built a new website for them. Your Jordan Bennett homepage was not changed.";
  return { site, reply, engine: "llm" as const };
}

function lastUserMessage(history: ChatTurn[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]?.role === "user") return history[i]?.content;
  }
  return undefined;
}

export type CustomizeResult = {
  homeSite: Site;
  site: Site;
  reply: string;
  engine: "llm" | "local";
  warning?: string;
  changed: boolean;
  homeChanged: boolean;
  project: ClientProject | null;
};

function sourceFor(message: string, cloned: boolean): ClientProject["source"] {
  if (cloned) return "clone";
  if (/\b(baker(?:y)?|coffee|caf[eé]|restaurant|gym|fitness|agency|portfolio)\b/i.test(message)) {
    return "template";
  }
  return "scratch";
}

function cleanBuildReply(reply: string, project: ClientProject) {
  const trimmed = reply
    .replace(/your private site/gi, "a new website for them")
    .replace(/It is live on your private site now\./gi, "")
    .trim();
  return projectReply(project, trimmed || `Built a new website called ${project.name}.`);
}

async function designClientSite(args: {
  base: Site;
  message: string;
  history: ChatTurn[];
  settings: StudioSettings;
}): Promise<{ site: Site; reply: string; engine: "llm" | "local"; warning?: string; changed: boolean }> {
  const creds = credentials(args.settings);
  const local = applyLocalDesign(args.base, args.message);
  const designed = {
    ...local,
    site: stripOwnerTools(applyClientIdentity(local.site, args.message)),
  };
  if (!creds.apiKey) {
    return { ...designed, engine: "local" };
  }
  try {
    const raw =
      creds.provider === "anthropic"
        ? await fromAnthropic({
            apiKey: creds.apiKey,
            model: creds.model,
            site: args.base,
            message: args.message,
            history: args.history,
          })
        : await fromOpenAI({
            apiKey: creds.apiKey,
            baseUrl: creds.baseUrl,
            model: creds.model,
            site: args.base,
            message: args.message,
            history: args.history,
          });
    const parsed = parseModelJson(raw, args.base);
    return {
      ...parsed,
      site: stripOwnerTools(applyClientIdentity(parsed.site, args.message)),
      changed: true,
    };
  } catch (error) {
    const warning = error instanceof Error ? error.message : "The language model failed.";
    return { ...designed, engine: "local", warning };
  }
}

export async function customizeSite(input: {
  homeSite: Site;
  activeProject: ClientProject | null;
  message: string;
  history?: ChatTurn[];
  settings: StudioSettings;
}): Promise<CustomizeResult> {
  const creds = credentials(input.settings);
  const history = input.history ?? [];
  const homeSite = input.homeSite;
  const unchanged = (reply: string, extra?: Partial<CustomizeResult>): CustomizeResult => ({
    homeSite,
    site: homeSite,
    reply,
    engine: extra?.engine ?? "local",
    warning: extra?.warning,
    changed: false,
    homeChanged: false,
    project: extra?.project ?? input.activeProject,
  });

  if (wantsPersonalHome(input.message)) {
    return unchanged(
      "Your Jordan Bennett homepage is still here. It was not replaced. New websites for other people live on their own links under /s/… — open the Sites tab.",
    );
  }

  if (looksLikeCloneRequest(input.message)) {
    const cloned = await clonePublicSite(blankClientSite(), input.message, lastUserMessage(history));
    if (!cloned) return unchanged("Send the https link of the page you want cloned into a new site for someone else.");
    if (!cloned.changed) {
      return unchanged(
        cloned.reply.replace(
          "I will rebuild this private site to match it from the public HTML.",
          "I will build a new website for them from the public HTML. Your homepage stays as it is.",
        ),
      );
    }
    const project = await createProject({
      site: cloned.site,
      source: "clone",
      sourceUrl: cloned.site.identity.tagline,
      message: input.message,
    });
    return {
      homeSite,
      site: homeSite,
      reply: projectReply(project, `Cloned that public page into a new website called ${project.name}.`),
      engine: "local",
      changed: true,
      homeChanged: false,
      project,
    };
  }

  if (looksLikeUrlMake(input.message)) {
    const result = await searchPublicDomains(input.message);
    return unchanged(formatDomainSearch(result));
  }

  const fact = tryFactualAnswer(homeSite, input.message);
  if (fact) return unchanged(fact);

  if (shouldCreateNewProject(input.message, Boolean(input.activeProject))) {
    const designed = await designClientSite({
      base: blankClientSite(),
      message: input.message,
      history,
      settings: input.settings,
    });
    if (!designed.changed) {
      return unchanged(designed.reply, { engine: designed.engine, warning: designed.warning });
    }
    const project = await createProject({
      site: designed.site,
      source: sourceFor(input.message, false),
      message: input.message,
    });
    return {
      homeSite,
      site: homeSite,
      reply: cleanBuildReply(designed.reply, project),
      engine: designed.engine,
      warning: designed.warning,
      changed: true,
      homeChanged: false,
      project,
    };
  }

  if (shouldEditClientProject(input.message, Boolean(input.activeProject)) && input.activeProject) {
    const designed = await designClientSite({
      base: input.activeProject.site,
      message: input.message,
      history,
      settings: input.settings,
    });
    if (!designed.changed) {
      return unchanged(designed.reply, {
        engine: designed.engine,
        warning: designed.warning,
        project: input.activeProject,
      });
    }
    const project = await writeProject({ ...input.activeProject, site: designed.site });
    return {
      homeSite,
      site: homeSite,
      reply: `Updated ${project.name} at ${publicUrlFor(project.slug)}. Your Jordan Bennett homepage was not changed.`,
      engine: designed.engine,
      warning: designed.warning,
      changed: true,
      homeChanged: false,
      project,
    };
  }

  if (!creds.apiKey) {
    return unchanged(answerLocally(homeSite, input.message));
  }
  try {
    const reply =
      creds.provider === "anthropic"
        ? await askAnthropic({
            apiKey: creds.apiKey,
            model: creds.model,
            site: homeSite,
            message: input.message,
            history,
          })
        : await askOpenAI({
            apiKey: creds.apiKey,
            baseUrl: creds.baseUrl,
            model: creds.model,
            site: homeSite,
            message: input.message,
            history,
          });
    return unchanged(reply || answerLocally(homeSite, input.message), { engine: "llm" });
  } catch {
    return unchanged(answerLocally(homeSite, input.message), {
      warning:
        "The saved AI key did not work, so I answered with the built-in helper. Fix it in Studio → Settings for fuller answers.",
    });
  }
}
