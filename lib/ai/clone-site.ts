import { defaultSite } from "../default-site";
import { fetchPublicHtml } from "../public-fetch";
import { parseSite, type Site, type SiteSection, type SiteTheme } from "../schema";
import { extractUrl, looksLikeCloneRequest } from "../url-guard";

function decode(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(html: string, name: string) {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return html.match(re)?.[1] ?? "";
}

function metaContent(html: string, key: string) {
  const property = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i"),
  )?.[0];
  if (!property) return "";
  return decode(attr(property, "content"));
}

function tags(html: string, tag: string) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const text = decode(match[1].replace(/<[^>]+>/g, " "));
    if (text && text.length > 1) out.push(text);
  }
  return out;
}

function isDarkHex(hex: string) {
  const n = hex.replace("#", "");
  if (n.length < 6) return true;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

function expandHex(raw: string) {
  const n = raw.replace("#", "");
  if (n.length === 3) return `#${n[0]}${n[0]}${n[1]}${n[1]}${n[2]}${n[2]}`.toLowerCase();
  if (n.length >= 6) return `#${n.slice(0, 6)}`.toLowerCase();
  return null;
}

function extractColors(html: string) {
  const theme = metaContent(html, "theme-color");
  const found = new Map<string, number>();
  const bump = (hex: string, weight: number) => {
    const next = expandHex(hex);
    if (!next || next === "#000000" || next === "#ffffff") return;
    found.set(next, (found.get(next) ?? 0) + weight);
  };
  if (theme.startsWith("#")) bump(theme, 20);
  const matches = html.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi) ?? [];
  for (const item of matches.slice(0, 80)) bump(item, 1);
  const ranked = [...found.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
  const bg = ranked.find((hex) => isDarkHex(hex)) || ranked[1] || "#14110e";
  const accent = ranked.find((hex) => hex !== bg) || "#d4a574";
  const lightBg = ranked.find((hex) => !isDarkHex(hex));
  const darkText = ranked.find((hex) => isDarkHex(hex) && hex !== bg);
  if (lightBg && !isDarkHex(bg)) {
    return {
      background: lightBg,
      surface: "#ffffff",
      text: darkText || "#161616",
      muted: "#5c5c56",
      accent,
      accentText: isDarkHex(accent) ? "#f7f7f4" : "#111111",
      border: "#d8d8d2",
      fontDisplay: "Fraunces",
      fontBody: "Outfit",
      radius: "soft",
    } satisfies SiteTheme;
  }
  return {
    background: bg,
    surface: "#1e1914",
    text: "#f4ece3",
    muted: "#b9a89a",
    accent,
    accentText: isDarkHex(accent) ? "#f7f7f4" : "#1a140f",
    border: "#3a3128",
    fontDisplay: "Fraunces",
    fontBody: "Outfit",
    radius: "soft",
  } satisfies SiteTheme;
}

function absUrl(base: string, src: string) {
  try {
    const url = new URL(src, base);
    if (url.protocol !== "https:") return null;
    if (url.pathname.endsWith(".svg")) return url.toString();
    return url.toString();
  } catch {
    return null;
  }
}

function images(html: string, base: string) {
  const re = /<img\b[^>]*>/gi;
  const out: { title?: string; caption?: string; image: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const src = attr(tag, "src") || attr(tag, "data-src");
    const width = Number(attr(tag, "width") || "200");
    const height = Number(attr(tag, "height") || "200");
    if (width <= 40 || height <= 40) continue;
    const url = absUrl(base, src);
    if (!url || url.startsWith("https://www.google.com/")) continue;
    if (out.some((item) => item.image === url)) continue;
    const alt = decode(attr(tag, "alt")).slice(0, 80);
    out.push({ title: alt || undefined, caption: alt || undefined, image: url.slice(0, 1000) });
    if (out.length >= 6) break;
  }
  return out;
}

function clip(value: string, max: number) {
  const clean = decode(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function cloneTargetUrl(message: string, previousUserMessage?: string) {
  return extractUrl(message) ?? (looksLikeCloneRequest(message) ? extractUrl(previousUserMessage ?? "") : null);
}

export function siteFromHtml(previous: Site, html: string, sourceUrl: string): Site {
  const title = clip(metaContent(html, "og:title") || tags(html, "title")[0] || previous.identity.siteName, 80) || previous.identity.siteName;
  const description = clip(
    metaContent(html, "og:description") || metaContent(html, "description") || "",
    300,
  );
  const headings = [...tags(html, "h1"), ...tags(html, "h2")].filter((item) => item.length < 160);
  const paragraphs = tags(html, "p")
    .map((item) => clip(item, 400))
    .filter((item) => item.length > 40)
    .slice(0, 8);
  const heroHeading = clip(headings[0] || title, 200);
  const subheading = clip(description || paragraphs[0] || `${title} rebuilt as a private page for ${previous.identity.ownerName}.`, 600);
  const featureHeads = headings.slice(1, 4);
  const features = (featureHeads.length ? featureHeads : ["What they lead with", "What they show next", "What to do"]).map(
    (heading, index) => ({
      title: clip(heading, 80),
      body: paragraphs[index + 1] || paragraphs[0] || "Ask the builder to rewrite this card.",
    }),
  );
  const photos = images(html, sourceUrl);
  const aboutBody = clip(
    paragraphs.slice(0, 3).join(" ") || `${title} — rebuilt on your private page. Only you can see it.`,
    4000,
  );

  const sections: SiteSection[] = [
    {
      type: "hero",
      layout: "cinematic",
      kicker: clip(new URL(sourceUrl).hostname.replace(/^www\./, ""), 80),
      heading: heroHeading,
      subheading,
      primaryCta: { label: "See more", href: "#work" },
      secondaryCta: { label: "Contact", href: "#contact" },
    },
    {
      id: "work",
      type: "features",
      heading: "From the original page",
      items: features.slice(0, 6),
    },
  ];
  if (photos.length) {
    sections.push({
      id: "gallery",
      type: "gallery",
      heading: "Images",
      items: photos,
    });
  }
  sections.push(
    {
      id: "about",
      type: "richtext",
      eyebrow: "About",
      heading: clip(title, 160),
      body: aboutBody,
    },
    {
      id: "contact",
      type: "contact",
      heading: "Say hello",
      body: "This is your private copy. Add an email or phone when you want.",
    },
    {
      type: "footer",
      note: clip(`${previous.identity.ownerName} · private rebuild of ${new URL(sourceUrl).hostname}`, 200),
    },
  );

  const next = defaultSite();
  next.identity = {
    ...previous.identity,
    siteName: title,
    tagline: clip(description || subheading, 200),
  };
  next.seo = {
    title: clip(`${title}`, 120),
    description: description || clip(subheading, 300),
  };
  next.theme = extractColors(html);
  next.nav = [
    { label: "Home", href: "/" },
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];
  next.pages = [
    {
      id: "home",
      slug: "/",
      title: "Home",
      sections,
    },
  ];
  next.updatedAt = new Date().toISOString();
  return parseSite(next);
}

export async function clonePublicSite(
  previous: Site,
  message: string,
  previousUserMessage?: string,
): Promise<{ site: Site; reply: string; changed: boolean } | null> {
  if (!looksLikeCloneRequest(message)) return null;
  const raw = cloneTargetUrl(message, previousUserMessage);
  if (!raw) {
    return {
      site: previous,
      reply:
        "Send the https link of the page you want cloned. I will rebuild this private site to match it from the public HTML.",
      changed: false,
    };
  }
  const fetched = await fetchPublicHtml(raw.includes("://") ? raw : `https://${raw}`);
  if (!fetched.ok) {
    return { site: previous, reply: fetched.error, changed: false };
  }
  const site = siteFromHtml(previous, fetched.html, fetched.url);
  site.identity.ownerName = previous.identity.ownerName;
  return {
    site,
    reply: `Rebuilt your private page from ${new URL(fetched.url).hostname}. Colors, heading, copy, and images came from that site. It is live for you now.`,
    changed: true,
  };
}
