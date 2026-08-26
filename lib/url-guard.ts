export type UrlScan = {
  answer: "yes" | "no";
  url?: string;
  reasons: string[];
};

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google.com",
]);

const PRIVATE_IPV4 = [
  { prefix: "0.", note: "this-network" },
  { prefix: "10.", note: "private" },
  { prefix: "127.", note: "loopback" },
  { prefix: "169.254.", note: "link-local" },
  { prefix: "192.168.", note: "private" },
];

const BRANDS = [
  "paypal",
  "apple",
  "google",
  "microsoft",
  "amazon",
  "facebook",
  "instagram",
  "whatsapp",
  "netflix",
  "chase",
  "wellsfargo",
];

const BAIT = /\b(login|signin|verify|secure|update|account|password|unlock|support|billing)\b/i;

function no(reasons: string[]): UrlScan {
  return { answer: "no", reasons };
}

function yes(url: string, reasons: string[]): UrlScan {
  return { answer: "yes", url, reasons };
}

export function extractUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s<>"']+/i) ?? text.match(/\b(?:www\.)?[a-z0-9][a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<>"']*)?/i);
  return match?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

export function looksLikeUrlQuestion(text: string) {
  if (looksLikeCloneRequest(text)) return false;
  if (extractUrl(text) && /\b(scan|check|safe|real|legit|okay|ok|open this)\b/i.test(text)) return true;
  return /\b(scan|check|safe|real|legit|okay|ok)\b.+\b(url|link|website|site)\b/i.test(text) ||
    /\b(url|link)\b.+\b(scan|check|safe|yes|no)\b/i.test(text);
}

export function looksLikeCloneRequest(text: string) {
  const t = text.trim();
  if (!t) return false;
  const scanning = /\b(scan|check|safe|legit|phishing|yes or no)\b/i.test(t);
  const cloning = /\b(clone|recreate|replicate|mirror)\b/i.test(t);
  if (scanning && !cloning) return false;

  const url = extractUrl(t);
  if (cloning) return true;
  if (/\b(copy|imitate)\b.{0,48}\b(this |the )?(site|website|page|webpage|homepage)\b/i.test(t)) return true;
  if (/\b(this |the )?(site|website|page|webpage|homepage)\b.{0,24}\b(copy|clone)\b/i.test(t)) return true;
  if (url && /\b(look like|like this|based on|from this|duplicate)\b/i.test(t)) return true;
  if (url && /\b(build|make|create|design)\b.{0,48}\b(like|from|clone|copy)\b/i.test(t)) return true;
  if (!url) return false;
  if (/\b(build|make|create|design)\b/i.test(t) && /\b(site|website|page|homepage)\b/i.test(t)) return true;
  const rest = t
    .replace(url, " ")
    .replace(/https?:\/\//gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return !rest || /^(this|here|please|this one|clone|copy)$/i.test(rest);
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return slug || "page";
}

export function nameToDotComHost(input: string) {
  let raw = input.trim().toLowerCase();
  if (!raw) return "";
  raw = raw.replace(/^https?:\/\//, "").replace(/^www\./, "");
  raw = raw.replace(/\/.*$/, "");
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(raw) && !raw.includes(" ")) {
    return raw;
  }
  raw = raw.replace(/\.(com|net|org|io|co|uk|ca|us)$/i, "");
  const label = raw
    .normalize("NFKD")
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "")
    .slice(0, 63);
  if (!label) return "";
  return `${label}.com`;
}

export function looksLikeUrlMake(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (looksLikeCloneRequest(t)) return false;
  if (/\bscan(?:ner)?\b/i.test(t) && /\b(url|link)\b/i.test(t)) return false;
  const customizingThePage =
    /\b(web ?site|homepage|heading|palette|colou?r|section|bakery|portfolio|restaurant|coffee|hero|tagline|background|font)\b/i.test(
      t,
    ) && !/\b(domain|registrar|godaddy|url for|make (?:me )?a url|need (?:an? )?(?:official |public )?url)\b/i.test(t);
  if (customizingThePage) return false;
  if (/\b(make|create|build|give me|get me|find me|register|buy)\b.{0,48}\b(url|domain)\b/i.test(t)) return true;
  if (/\bneed (?:a |an |me a )?(?:public |official |real )?(?:url|domain)\b/i.test(t)) return true;
  if (/\bat\s+\.com\b/i.test(t)) return true;
  if (/\burl for\b/i.test(t)) return true;
  if (/\bdomain (?:for|search|availability)\b/i.test(t)) return true;
  return false;
}

export function nameForUrlMake(text: string) {
  let t = text.trim();
  t = t.replace(/^(please\s+)?((can|could) you\s+)?/i, "");
  t = t.replace(/^(make|create|build|give me)\s+(a\s+|an\s+|me\s+)?/i, "");
  t = t.replace(/\b(url|link|domain|web address|website address)\b/gi, " ");
  t = t.replace(/\bfor\b/gi, " ");
  t = t.replace(/\bat\s+\.com\b/gi, " ");
  t = t.replace(/\s*\.com\s*$/i, "");
  t = t.replace(/["“”]+/g, " ").replace(/\s+/g, " ").trim();
  return t || null;
}

export function generateUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Type a name first." };
  }

  const extracted = extractUrl(trimmed);
  if (extracted && !looksLikeUrlMake(trimmed) && /https?:\/\//i.test(trimmed)) {
    const withScheme = extracted.includes("://") ? extracted : `https://${extracted}`;
    const scanned = scanUrl(withScheme);
    const url = (scanned.url || withScheme).replace(/\/$/, "");
    try {
      return { ok: true as const, url, host: new URL(withScheme).hostname, scan: scanned };
    } catch {
      return { ok: true as const, url, host: withScheme, scan: scanned };
    }
  }

  const source = nameForUrlMake(trimmed) || trimmed;
  const host = nameToDotComHost(source);
  if (!host) {
    return { ok: false as const, error: "Type a name to turn into a .com address." };
  }
  const url = `https://${host}`;
  return { ok: true as const, url, host, scan: scanUrl(url) };
}

function isPrivateIPv4(host: string) {
  if (PRIVATE_IPV4.some((item) => host.startsWith(item.prefix))) return true;
  const match = host.match(/^172\.(\d+)\./);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

function brandSpoof(hostname: string) {
  const host = hostname.toLowerCase();
  const labels = host.split(".");
  for (const brand of BRANDS) {
    const isOfficial =
      host === `${brand}.com` ||
      host === `www.${brand}.com` ||
      host.endsWith(`.${brand}.com`) ||
      host === `${brand}.co` ||
      host.endsWith(`.${brand}.co.uk`);
    if (isOfficial) continue;
    if (host.includes(brand) && (BAIT.test(host) || labels.length > 2)) return brand;
  }
  return null;
}

export function scanUrl(raw: string): UrlScan {
  const text = raw.trim();
  if (!text) return no(["Nothing to scan."]);
  if (text.length > 2000) return no(["That link is far too long to be a normal web address."]);

  const lowered = text.toLowerCase();
  if (
    lowered.startsWith("javascript:") ||
    lowered.startsWith("data:") ||
    lowered.startsWith("file:") ||
    lowered.startsWith("vbscript:")
  ) {
    return no(["That is not a web page. Do not open it."]);
  }

  let parsed: URL;
  try {
    parsed = new URL(text.includes("://") ? text : `https://${text}`);
  } catch {
    return no(["That is not a real URL."]);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return no(["Only http and https links can be checked."]);
  }

  const reasons: string[] = [];
  if (parsed.protocol === "http:") {
    reasons.push("This link is not encrypted (http). Treat it as no.");
    return { answer: "no", url: parsed.toString(), reasons };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) return no(["That link has no website name."]);
  if (BLOCKED_HOSTS.has(hostname)) return no(["That points at a local machine, not a public website."]);
  if (hostname === "::1" || hostname === "0.0.0.0") return no(["That points at a local machine, not a public website."]);
  if (isPrivateIPv4(hostname) || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return no(["That uses a raw or private address. Do not open it."]);
  }
  if (parsed.username || parsed.password) {
    return no(["The link hides a username or password inside it. That is a common trick."]);
  }
  if (hostname.startsWith("xn--")) {
    return no(["The website name uses encoded look-alike characters."]);
  }
  if (hostname.split(".").length > 5) {
    return no(["The website name has too many extra parts. That is often a fake."]);
  }
  const spoof = brandSpoof(hostname);
  if (spoof) {
    return no([`It pretends to be ${spoof} but it is not the real ${spoof} website.`]);
  }

  reasons.push("It looks like a normal https web address.");
  return yes(parsed.toString(), reasons);
}

export function formatAnswer(scan: UrlScan) {
  const word = scan.answer === "yes" ? "YES" : "NO";
  const why = scan.reasons.join(" ");
  const url = scan.url ? ` Checked: ${scan.url}` : "";
  return `${word}.${url} ${why}`.trim();
}
