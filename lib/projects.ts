import { promises as fs } from "node:fs";
import path from "node:path";
import { applyClientIdentity, publicPathFor, stripOwnerTools } from "./client-site";
import { dataDir } from "./paths";
import { parseSite, type Site } from "./schema";

export type ProjectSource = "scratch" | "clone" | "template";

export type ClientProject = {
  slug: string;
  name: string;
  clientName: string;
  source: ProjectSource;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  site: Site;
};

export type ProjectSummary = Omit<ClientProject, "site">;

type ProjectIndex = {
  version: 1;
  activeSlug?: string;
  projects: ProjectSummary[];
};

function projectsDir() {
  return path.join(dataDir(), "projects");
}

function indexPath() {
  return path.join(projectsDir(), "index.json");
}

function projectPath(slug: string) {
  return path.join(projectsDir(), `${slug}.json`);
}

async function ensureDir() {
  await fs.mkdir(projectsDir(), { recursive: true });
}

function emptyIndex(): ProjectIndex {
  return { version: 1, projects: [] };
}

async function readIndex(): Promise<ProjectIndex> {
  await ensureDir();
  try {
    const raw = await fs.readFile(indexPath(), "utf8");
    const parsed = JSON.parse(raw) as ProjectIndex;
    if (!parsed || !Array.isArray(parsed.projects)) return emptyIndex();
    return { version: 1, activeSlug: parsed.activeSlug, projects: parsed.projects };
  } catch {
    return emptyIndex();
  }
}

async function writeIndex(index: ProjectIndex) {
  await ensureDir();
  await fs.writeFile(indexPath(), `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

export function slugifyName(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "site";
}

export async function uniqueSlug(name: string) {
  const index = await readIndex();
  const taken = new Set(index.projects.map((item) => item.slug));
  const base = slugifyName(name);
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const next = `${base}-${i}`.slice(0, 48);
    if (!taken.has(next)) return next;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function toSummary(project: ClientProject): ProjectSummary {
  return {
    slug: project.slug,
    name: project.name,
    clientName: project.clientName,
    source: project.source,
    sourceUrl: project.sourceUrl,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function publicUrlFor(slug: string) {
  return publicPathFor(slug);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const index = await readIndex();
  return [...index.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getActiveSlug() {
  const index = await readIndex();
  return index.activeSlug ?? index.projects[0]?.slug ?? null;
}

export async function setActiveSlug(slug: string | null) {
  const index = await readIndex();
  index.activeSlug = slug || undefined;
  await writeIndex(index);
}

export async function readProject(slug: string): Promise<ClientProject | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(projectPath(slug), "utf8");
    const parsed = JSON.parse(raw) as ClientProject;
    return {
      ...parsed,
      site: stripOwnerTools(parseSite(parsed.site)),
    };
  } catch {
    return null;
  }
}

export async function readActiveProject(): Promise<ClientProject | null> {
  const slug = await getActiveSlug();
  if (!slug) return null;
  return readProject(slug);
}

export async function writeProject(project: ClientProject): Promise<ClientProject> {
  await ensureDir();
  const next: ClientProject = {
    ...project,
    site: stripOwnerTools(parseSite({ ...project.site, updatedAt: new Date().toISOString(), version: 1 })),
    updatedAt: new Date().toISOString(),
    name: project.site.identity.siteName || project.name,
    clientName: project.site.identity.ownerName || project.clientName || project.name,
  };
  await fs.writeFile(projectPath(next.slug), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  const index = await readIndex();
  const summary = toSummary(next);
  const existing = index.projects.findIndex((item) => item.slug === next.slug);
  if (existing >= 0) index.projects[existing] = summary;
  else index.projects.unshift(summary);
  index.activeSlug = next.slug;
  await writeIndex(index);
  return next;
}

export async function createProject(input: {
  site: Site;
  source: ProjectSource;
  sourceUrl?: string;
  message?: string;
}): Promise<ClientProject> {
  const site = applyClientIdentity(stripOwnerTools(input.site), input.message || "");
  const name = site.identity.siteName || "New site";
  const slug = await uniqueSlug(name);
  const now = new Date().toISOString();
  return writeProject({
    slug,
    name,
    clientName: site.identity.ownerName || name,
    source: input.source,
    sourceUrl: input.sourceUrl,
    createdAt: now,
    updatedAt: now,
    site,
  });
}

export async function deleteProject(slug: string) {
  const index = await readIndex();
  index.projects = index.projects.filter((item) => item.slug !== slug);
  if (index.activeSlug === slug) index.activeSlug = index.projects[0]?.slug;
  await writeIndex(index);
  await fs.unlink(projectPath(slug)).catch(() => undefined);
}

export function projectReply(project: ClientProject, action: string) {
  const url = publicUrlFor(project.slug);
  return `${action} Your Jordan Bennett homepage was not changed. Other people can open the new site at ${url}.`;
}
