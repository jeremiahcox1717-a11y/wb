import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultSite } from "./default-site";
import { emptyNotebook, parseNotebook, type Notebook, type NotebookEntry } from "./notebook";
import { dataDir } from "./paths";
import { parseSite, type Site } from "./schema";
import { ensureScannerSections } from "./scanner-sections";

const sitePath = path.join(dataDir(), "site.json");
const settingsPath = path.join(dataDir(), "settings.json");
const notebookPath = path.join(dataDir(), "notebook.json");

export type StudioSettings = {
  apiKey?: string;
  provider?: "openai" | "anthropic" | "compatible";
  model?: string;
  baseUrl?: string;
};

async function ensureDataDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

export async function readSite(): Promise<Site> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(sitePath, "utf8");
    return ensureScannerSections(parseSite(JSON.parse(raw)));
  } catch {
    const site = defaultSite();
    await writeSite(site);
    return site;
  }
}

export async function writeSite(site: Site): Promise<Site> {
  await ensureDataDir();
  const next = ensureScannerSections(
    parseSite({ ...site, updatedAt: new Date().toISOString(), version: 1 }),
  );
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

export async function readNotebook(): Promise<Notebook> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(notebookPath, "utf8");
    return parseNotebook(JSON.parse(raw));
  } catch {
    return emptyNotebook();
  }
}

export async function writeNotebook(notebook: Notebook): Promise<Notebook> {
  await ensureDataDir();
  const next = parseNotebook({ version: 1, entries: notebook.entries });
  await fs.writeFile(notebookPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export async function addNotebookEntry(
  entry: Omit<NotebookEntry, "id" | "createdAt"> & { id?: string; createdAt?: string },
): Promise<Notebook> {
  const notebook = await readNotebook();
  notebook.entries.unshift({
    id: entry.id || crypto.randomUUID(),
    name: entry.name,
    businessName: entry.businessName,
    phone: entry.phone,
    email: entry.email,
    createdAt: entry.createdAt || new Date().toISOString(),
  });
  return writeNotebook(notebook);
}

export async function deleteNotebookEntry(id: string): Promise<Notebook> {
  const notebook = await readNotebook();
  return writeNotebook({
    version: 1,
    entries: notebook.entries.filter((item) => item.id !== id),
  });
}
