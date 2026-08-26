import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { scanUrl } from "./url-guard";

function isBlockedAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.includes(":")) {
    const compact = address.toLowerCase();
    return compact.startsWith("fc") || compact.startsWith("fd") || compact.startsWith("fe80");
  }
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export async function hostIsPublic(hostname: string) {
  if (isIP(hostname)) return !isBlockedAddress(hostname);
  const results = await lookup(hostname, { all: true, verbatim: true });
  if (results.length === 0) return false;
  return results.every((item) => !isBlockedAddress(item.address));
}

export async function fetchPublicHtml(raw: string): Promise<{ ok: true; url: string; html: string } | { ok: false; error: string }> {
  const staticScan = scanUrl(raw);
  if (staticScan.answer === "no" || !staticScan.url) {
    return { ok: false, error: staticScan.reasons[0] || "That is not a public https page I can open." };
  }

  let parsed: URL;
  try {
    parsed = new URL(staticScan.url);
  } catch {
    return { ok: false, error: "That is not a real URL." };
  }

  try {
    if (!(await hostIsPublic(parsed.hostname))) {
      return { ok: false, error: "That host is not a public website." };
    }
  } catch {
    return { ok: false, error: "That website name could not be found." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "wb-site-clone/1.0",
      },
    });
    const finalUrl = response.url || parsed.toString();
    let finalParsed: URL;
    try {
      finalParsed = new URL(finalUrl);
    } catch {
      return { ok: false, error: "That page redirected somewhere I will not open." };
    }
    if (finalParsed.protocol !== "https:") {
      return { ok: false, error: "That page is not https." };
    }
    if (!(await hostIsPublic(finalParsed.hostname))) {
      return { ok: false, error: "That page redirected to a host that is not public." };
    }
    if (!response.ok) {
      return { ok: false, error: `That site answered with ${response.status}.` };
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 900_000) {
      return { ok: false, error: "That page is too large to clone." };
    }
    const html = new TextDecoder("utf-8").decode(buffer);
    return { ok: true, url: finalParsed.toString(), html };
  } catch {
    return { ok: false, error: "I could not download that page in time." };
  } finally {
    clearTimeout(timer);
  }
}
