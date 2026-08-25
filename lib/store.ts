import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultSite } from "./default-site";
import { parseSite, type Site } from "./schema";

const dataDir = path.join(process.cwd(), "data");
const sitePath = path.join(dataDir, "site.json");
const settingsPath = path.join(dataDir, "settings.json");

export type StudioSettings = {
  apiKey?: string;
  provider?: "openai" | "anthropic" | "compatible";
  model?: string;
  baseUrl?: string;
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readSite(): Promise<Site> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(sitePath, "utf8");
    return parseSite(JSON.parse(raw));
  } catch {
    const site = defaultSite();
    await writeSite(site);
    return site;
  }
}

export async function writeSite(site: Site): Promise<Site> {
  await ensureDataDir();
  const next = parseSite({ ...site, updatedAt: new Date().toISOString(), version: 1 });
  await fs.writeFile(sitePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export async function readSettings(): Promise<StudioSettings> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as StudioSettings;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeSettings(patch: StudioSettings): Promise<StudioSettings> {
  await ensureDataDir();
  const next: StudioSettings = { ...(await readSettings()) };
  if (typeof patch.apiKey === "string") {
    if (patch.apiKey) next.apiKey = patch.apiKey;
    else delete next.apiKey;
  }
  if (typeof patch.model === "string" && patch.model) next.model = patch.model;
  if (patch.provider) next.provider = patch.provider;
  if (typeof patch.baseUrl === "string") {
    if (patch.baseUrl) next.baseUrl = patch.baseUrl;
    else delete next.baseUrl;
  }
  await fs.writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function publicSettings(settings: StudioSettings) {
  return {
    hasKey: Boolean(settings.apiKey || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
    provider: settings.provider ?? (process.env.ANTHROPIC_API_KEY && !settings.apiKey ? "anthropic" : "openai"),
    model:
      settings.model ||
      process.env.OPENAI_MODEL ||
      (process.env.ANTHROPIC_API_KEY ? "claude-sonnet-4-5" : "gpt-4.1-mini"),
    baseUrl: settings.baseUrl || process.env.OPENAI_BASE_URL || "",
  };
}
