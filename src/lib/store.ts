import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { PostcodeRecord, SavedLead, Settings } from "./types";

const DATA_DIR = process.env.UNLISTED_DATA_DIR || join(process.cwd(), "data");
const USED_FILE = join(DATA_DIR, "used-postcodes.json");
const LEADS_FILE = join(DATA_DIR, "leads.json");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

const defaultSettings: Settings = {
  defaultCountry: "uk",
  defaultRadius: 900,
  skipWholeOutcode: true,
  lockedArea: "",
};

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  ensureDir();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

export function getUsedPostcodes(): PostcodeRecord[] {
  return readJson<PostcodeRecord[]>(USED_FILE, []);
}

export function isPostcodeUsed(postcode: string, outcode: string, skipWholeOutcode: boolean) {
  const used = getUsedPostcodes();
  const pc = normalizePostcode(postcode);
  const oc = outcode.toUpperCase().trim();
  return used.some((row) => {
    if (normalizePostcode(row.postcode) === pc) return true;
    if (skipWholeOutcode && row.outcode.toUpperCase() === oc) return true;
    return false;
  });
}

export function rememberPostcode(record: PostcodeRecord) {
  const used = getUsedPostcodes();
  if (used.some((row) => normalizePostcode(row.postcode) === normalizePostcode(record.postcode))) {
    return used;
  }
  used.unshift(record);
  writeJson(USED_FILE, used);
  return used;
}

export function forgetPostcode(postcode: string) {
  const next = getUsedPostcodes().filter(
    (row) => normalizePostcode(row.postcode) !== normalizePostcode(postcode),
  );
  writeJson(USED_FILE, next);
  return next;
}

export function getLeads(): SavedLead[] {
  return readJson<SavedLead[]>(LEADS_FILE, []);
}

export function saveLead(lead: SavedLead) {
  const leads = getLeads().filter((row) => row.id !== lead.id);
  leads.unshift(lead);
  writeJson(LEADS_FILE, leads);
  return leads;
}

export function updateLead(id: string, patch: Partial<SavedLead>) {
  const leads = getLeads().map((row) => (row.id === id ? { ...row, ...patch, id: row.id } : row));
  writeJson(LEADS_FILE, leads);
  return leads;
}

export function deleteLead(id: string) {
  const leads = getLeads().filter((row) => row.id !== id);
  writeJson(LEADS_FILE, leads);
  return leads;
}

export function getSettings(): Settings {
  return { ...defaultSettings, ...readJson<Partial<Settings>>(SETTINGS_FILE, {}) };
}

export function saveSettings(patch: Partial<Settings>) {
  const next = { ...getSettings(), ...patch };
  writeJson(SETTINGS_FILE, next);
  return next;
}

export function normalizePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trim();
}
