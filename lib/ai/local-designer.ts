import { palettes } from "../default-site";
import type { Site, SiteSection, SiteTheme } from "../schema";
import { parseSite } from "../schema";
import { looksLikeUrlMake } from "../url-guard";
import { answerLocally } from "./answer";
import { genericBusiness, templateMatchers, templates } from "./templates";

const PALETTE_WORDS: { key: keyof typeof palettes; re: RegExp }[] = [
  { key: "linen", re: /\b(linen|cream|warm paper|beige|bakery[- ]?like)\b/i },
  { key: "ocean", re: /\b(ocean|teal|aqua|sea)\b/i },
  { key: "noir", re: /\b(noir|black and white|monochrome|minimal black)\b/i },
  { key: "orchard", re: /\b(forest|orchard|olive)\b/i },
  { key: "rose", re: /\b(rose|pink|blush|magenta)\b/i },
  { key: "paper", re: /\b(paper|editorial|newspaper|light mode)\b/i },
  { key: "copper", re: /\b(copper|gold|bronze|amber|luxury)\b/i },
];

const NAMED_COLORS: Record<string, string> = {
  red: "#b42318",
  crimson: "#9b1c1c",
  blue: "#1d4e89",
  navy: "#0b1f3a",
  green: "#1f6b3a",
  forest: "#143d28",
  gold: "#c4a35a",
  yellow: "#c9a227",
  orange: "#c45c26",
  purple: "#5b2a86",
  violet: "#5b2a86",
  pink: "#d97aa5",
  brown: "#6b3f2a",
  black: "#0b0b0c",
  white: "#f7f7f4",
  cream: "#f6f1e7",
  gray: "#6e6e6a",
  grey: "#6e6e6a",
  teal: "#0f6f74",
  silver: "#c5c5c0",
};

const FONTS: { re: RegExp; display: string; body: string }[] = [
  { re: /\b(playfair|serif|editorial font)\b/i, display: "Playfair Display", body: "Source Sans 3" },
  { re: /\b(inter|sans[- ]serif|modern font)\b/i, display: "Inter", body: "Inter" },
  { re: /\b(georgia)\b/i, display: "Georgia", body: "Georgia" },
  { re: /\b(mono|monospace|code font)\b/i, display: "IBM Plex Mono", body: "IBM Plex Mono" },
  { re: /\b(oswald|tall font|condensed)\b/i, display: "Oswald", body: "Manrope" },
  { re: /\b(cormorant|fancy|script[- ]like)\b/i, display: "Cormorant Garamond", body: "Manrope" },
  { re: /\bfraunces\b/i, display: "Fraunces", body: "Outfit" },
];

const CUSTOMIZE =
  /\b(make|build|rebuild|redesign|turn|change|update|edit|set|add|remove|delete|hide|put|replace|rewrite|customize|customise|apply|switch|rename|use|want|need|please)\b/i;

const SITE_PART =
  /\b(site|website|page|homepage|hero|heading|headline|title|tagline|subtitle|subheading|kicker|about|bio|story|color|colour|palette|theme|background|font|section|layout|footer|button|nav|menu|gallery|faq|pricing|testimonial|team|contact|cta)\b/i;

function clone(site: Site): Site {
  return parseSite(JSON.parse(JSON.stringify(site)));
}

function hero(site: Site) {
  return site.pages[0]?.sections.find((section) => section.type === "hero");
}

function about(site: Site) {
  return site.pages[0]?.sections.find((section) => section.type === "richtext");
}

function upsertSection(site: Site, section: SiteSection) {
  const page = site.pages[0];
  if (!page) return;
  const index = page.sections.findIndex((item) => item.type === section.type);
  const footerIndex = page.sections.findIndex((item) => item.type === "footer");
  if (index >= 0) {
    page.sections[index] = { ...page.sections[index], ...section, id: page.sections[index].id || section.id };
    return;
  }
  if (page.sections.length >= 18) return;
  const insertAt = footerIndex >= 0 ? footerIndex : page.sections.length;
  page.sections.splice(insertAt, 0, section);
}

function applyName(site: Site, name: string) {
  site.identity.siteName = name;
  site.identity.ownerName = name;
  site.seo.title = name;
  const heading = hero(site);
  if (heading && heading.type === "hero") heading.heading = name;
  const footer = site.pages[0]?.sections.find((section) => section.type === "footer");
  if (footer && footer.type === "footer") footer.note = name;
}

function isBareBuild(text: string) {
  return /^(please\s+)?((can|could) you\s+)?(build|make|create|design)\s+(me\s+)?(a\s+|an\s+)?((web\s*)?site|webpage|page|homepage)\s*[.!?]?$/i.test(
    text.trim(),
  );
}

function isGreeting(text: string) {
  return /^(hi|hello|hey|yo|sup|thanks|thank you|thx)[.!?]*$/i.test(text.trim());
}

function isQuestionOnly(text: string) {
  const t = text.trim();
  if (isGreeting(t)) return true;
  if (CUSTOMIZE.test(t) || SITE_PART.test(t)) return false;
  if (templateMatchers.some((item) => item.re.test(t))) return false;
  return (
    /\?/.test(t) ||
    /^(who|what|when|where|why|how|which|can you tell|explain|do you|does|is this|are you|tell me)\b/i.test(t)
  );
}

export function wantsSiteChange(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (looksLikeUrlMake(t)) return false;
  if (isBareBuild(t) || isGreeting(t) || isQuestionOnly(t)) return false;
  if (
    /^(how (?:do i|can i)|what can you|explain how|can you tell me how)\b/i.test(t) &&
    !/\b(?:to|into|as)\s+["“A-Z]/i.test(t)
  ) {
    return false;
  }

  const identity =
    /\b(my name is|i(?:'| a)?m [A-Z]|site name|heading should|tagline should|brand(?:ed)? as)\b/.test(t) ||
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(t) ||
    /\b(?:phone|call|text)\b[^\d]{0,12}\+?[\d]/.test(t) ||
    /\b(?:based in|located in|address is)\b/i.test(t);

  if (CUSTOMIZE.test(t) || SITE_PART.test(t) || identity) return true;
  if (templateMatchers.some((item) => item.re.test(t))) return true;
  if (/^#[0-9a-f]{3,8}\b/i.test(t)) return true;
  return false;
}

function clipCopy(value: string) {
  return value.replace(/\s+\b(and add|then add|with a|with an)\b[\s\S]*$/i, "").trim();
}

function quoted(text: string) {
  return text.match(/["“](.+?)["”]/)?.[1]?.trim() || null;
}

function tailAfter(text: string, re: RegExp) {
  const match = text.match(re);
  return match?.[1]?.trim().replace(/[.]+$/, "") || null;
}

function hexColor(text: string) {
  const match = text.match(/#([0-9a-f]{3,8})\b/i);
  if (!match) return null;
  const raw = match[1];
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  if (raw.length === 6 || raw.length === 8) return `#${raw.slice(0, 6)}`;
  return null;
}

function namedColor(text: string) {
  for (const [name, value] of Object.entries(NAMED_COLORS)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) return { name, value };
  }
  return null;
}

function isDarkHex(hex: string) {
  const n = hex.replace("#", "");
  if (n.length < 6) return true;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

function themeAround(color: string): Partial<SiteTheme> {
  const dark = isDarkHex(color);
  if (dark) {
    return {
      background: color,
      surface: "#161617",
      text: "#f3f3f1",
      muted: "#a3a39b",
      accent: "#f2f2f0",
      accentText: "#111111",
      border: "#2a2a2c",
    };
  }
  return {
    background: color,
    surface: "#ffffff",
    text: "#161616",
    muted: "#5c5c56",
    accent: "#111111",
    accentText: "#f7f7f4",
    border: "#d8d8d2",
  };
}

function extractBusiness(text: string) {
  const patterns = [
    /\b(?:turn (?:this|it) into|rebuild (?:this|it) as|make (?:this|it)(?: into)?)\s+(?:a |an )?([^,.!?]+?)(?:\s+with\b|\s+and\s+add\b|[,.!?]|$)/i,
    /\b(?:build|make|create)\s+(?:me\s+)?(?:a |an )([^,.!?]+?)(?:\s+website|\s+site|\s+page)\b/i,
    /\bi (?:want|need)\s+(?:a |an )([^,.!?]+?)(?:\s+website|\s+site|\s+page)?(?:\s+with\b|[,.!?]|$)/i,
    /\b(?:a |an )([^,.!?]{3,40}?)\s+(?:website|site|page|shop|store)\b/i,
  ];
  for (const re of patterns) {
    const value = tailAfter(text, re);
    if (!value) continue;
    const cleaned = value
      .replace(/\b(called|named)\b.+$/i, "")
      .replace(/\b(with|using|in)\b.+$/i, "")
      .replace(/\b(website|site|page|homepage)\b/gi, "")
      .trim();
    if (!cleaned || /^(web\s*)?(site|page|homepage)$/i.test(cleaned)) continue;
    return cleaned.slice(0, 60);
  }
  return null;
}

function sectionBuilders(): Record<string, SiteSection> {
  return {
    testimonials: {
      type: "testimonials",
      heading: "Kind words",
      items: [
        { quote: "Replace this with a real customer line.", name: "A. Neighbor" },
        { quote: "Ask for more quotes whenever you have them.", name: "A. Guest" },
      ],
    },
    faq: {
      type: "faq",
      heading: "Questions",
      items: [
        { question: "Can anyone else view this site?", answer: "No. The whole site is locked behind your owner password." },
        { question: "How fast do changes go live?", answer: "Immediately. Your private page updates as soon as the bot replies." },
      ],
    },
    pricing: {
      type: "pricing",
      heading: "Pricing",
      plans: [
        {
          name: "Starter",
          price: "$0",
          description: "Replace these numbers.",
          features: ["Public page", "Instant updates"],
          cta: { label: "Ask us", href: "#contact" },
        },
        {
          name: "Studio",
          price: "$—",
          featured: true,
          description: "The offer you actually sell.",
          features: ["Custom work", "Direct contact"],
          cta: { label: "Get this", href: "#contact" },
        },
      ],
    },
    gallery: {
      type: "gallery",
      heading: "Gallery",
      items: [
        { title: "One", caption: "Add a real image URL when you have one.", image: "https://picsum.photos/seed/wb1/800/600" },
        { title: "Two", caption: "Ask the builder to swap these.", image: "https://picsum.photos/seed/wb2/800/600" },
        { title: "Three", caption: "Keep this list short.", image: "https://picsum.photos/seed/wb3/800/600" },
      ],
    },
    team: {
      type: "team",
      heading: "Team",
      members: [
        { name: "Jordan Bennett", role: "Owner", bio: "Replace this with the people who should appear here." },
        { name: "A. Partner", role: "Studio", bio: "Ask the builder to rename these." },
      ],
    },
    cta: {
      type: "cta",
      heading: "Ready when you are",
      body: "Tell people what to do next.",
      cta: { label: "Get in touch", href: "#contact" },
    },
    stats: {
      type: "stats",
      items: [
        { value: "Live", label: "Saved when you send" },
        { value: "1", label: "Owner" },
        { value: "Now", label: "On this page" },
      ],
    },
    contact: {
      type: "contact",
      heading: "Say hello",
      body: "Add your email, phone, or city and this block will fill itself in.",
    },
  };
}

export function applyLocalDesign(site: Site, message: string): { site: Site; reply: string; changed: boolean } {
  const text = message.trim();
  if (!text) {
    return { site, reply: "Ask a question, or tell me what to change on your private site.", changed: false };
  }

  if (!wantsSiteChange(text)) {
    if (isBareBuild(text)) {
      return {
        site,
        reply:
          "I can build it. Tell me the kind of site — bakery, coffee shop, restaurant, gym, portfolio, barbershop, or any other business — plus a color if you want, and I will rebuild this page for you.",
        changed: false,
      };
    }
    return { site, reply: answerLocally(site, text), changed: false };
  }

  let next = clone(site);
  const notes: string[] = [];

  const template = templateMatchers.find((item) => item.re.test(text));
  if (template) {
    next = templates[template.name](next);
    notes.push(`Rebuilt your private site as a ${template.label}.`);
  } else {
    const kind = extractBusiness(text);
    if (kind) {
      next = genericBusiness(next, kind);
      notes.push(`Rebuilt your private site as a ${kind}.`);
    }
  }

  const palette = PALETTE_WORDS.find((item) => item.re.test(text));
  if (palette) {
    next.theme = { ...next.theme, ...palettes[palette.key] };
    notes.push(`Applied the ${palettes[palette.key].label} palette.`);
  } else if (/\b(dark(?:er)?|night|black background)\b/i.test(text) && !template) {
    next.theme = { ...next.theme, ...palettes.noir };
    notes.push("Switched the site to a dark noir palette.");
  } else if (/\b(light(?:er)?|daylight|white background|bright)\b/i.test(text) && !template) {
    next.theme = { ...next.theme, ...palettes.paper };
    notes.push("Switched the site to a light paper palette.");
  }

  const hex = hexColor(text);
  const named = namedColor(text);
  const color = hex || named?.value;
  if (color) {
    const wantsText = /\b(text|type|heading color|font color)\b/i.test(text);
    const wantsAccent = /\b(accent|button|highlight)\b/i.test(text);
    const wantsBg = /\b(background|bg|make it|make the site|theme|page)\b/i.test(text) || (!wantsText && !wantsAccent);
    if (wantsText) {
      next.theme.text = color;
      notes.push(`Set the text color to ${color}.`);
    }
    if (wantsAccent) {
      next.theme.accent = color;
      next.theme.accentText = isDarkHex(color) ? "#f7f7f4" : "#111111";
      notes.push(`Set the accent color to ${color}.`);
    }
    if (wantsBg && !wantsText) {
      next.theme = { ...next.theme, ...themeAround(color) };
      if (wantsAccent) {
        next.theme.accent = color;
        next.theme.accentText = isDarkHex(color) ? "#f7f7f4" : "#111111";
      }
      notes.push(`Set the page colors around ${named?.name || color}.`);
    }
  }

  const font = FONTS.find((item) => item.re.test(text));
  if (font) {
    next.theme.fontDisplay = font.display;
    next.theme.fontBody = font.body;
    notes.push(`Switched the fonts to ${font.display}.`);
  }

  if (/\b(round(?:ed)?|pill|softer corners)\b/i.test(text)) {
    next.theme.radius = "round";
    notes.push("Rounded the corners.");
  } else if (/\b(sharp|square corners|no radius)\b/i.test(text)) {
    next.theme.radius = "sharp";
    notes.push("Sharpened the corners.");
  } else if (/\bsoft corners\b/i.test(text)) {
    next.theme.radius = "soft";
    notes.push("Softened the corners.");
  }

  const currentHero = hero(next);
  if (currentHero && currentHero.type === "hero") {
    if (/\b(split|two[- ]column)\b/i.test(text)) {
      currentHero.layout = "split";
      notes.push("Used a split hero layout.");
    } else if (/\b(centered|centre|center the hero)\b/i.test(text)) {
      currentHero.layout = "centered";
      notes.push("Centered the hero.");
    } else if (/\beditorial\b/i.test(text)) {
      currentHero.layout = "editorial";
      notes.push("Used an editorial hero.");
    } else if (/\b(cinematic|full[- ]?screen|bigger hero|bigger heading)\b/i.test(text)) {
      currentHero.layout = "cinematic";
      notes.push("Used a cinematic hero.");
    }
  }

  const namedSite = text.match(
    /\b(?:call(?:ed)? it|rename(?:d)? (?:it )?to|site name(?: is| to)?|brand(?:ed)? as)\s+["“]?([A-Za-z0-9&'’.\- ]{2,60})["”]?/i,
  );
  const myName = text.match(/\b(?:my name is|i(?:'| a)?m)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\b/);
  if (namedSite?.[1]) {
    applyName(next, namedSite[1].trim().replace(/[.]+$/, ""));
    notes.push(`Renamed the site to ${next.identity.siteName}.`);
  } else if (myName?.[1] && !template) {
    applyName(next, myName[1].trim());
    notes.push(`Set the owner name to ${next.identity.ownerName}.`);
  }

  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  if (email) {
    next.identity.email = email[0];
    notes.push("Added your email to the contact block.");
  }

  const phone = text.match(/\b(?:phone|call|text)\b[^\d]{0,12}(\+?[\d().\-\s]{7,20})/i);
  if (phone?.[1]) {
    next.identity.phone = phone[1].trim();
    notes.push("Added a phone number.");
  }

  const location = text.match(/\b(?:in|based in|located in|address is)\s+([A-Za-z0-9 ,.'-]{3,80})/i);
  if (location?.[1] && !templateMatchers.some((item) => item.re.test(location[1]))) {
    next.identity.location = location[1].replace(/[.]+$/, "").trim();
    notes.push(`Set the location to ${next.identity.location}.`);
  }

  const quote = quoted(text);
  const headingValue =
    tailAfter(
      text,
      /\b(?:heading|headline|title)(?:\s+should(?:\s+be|\s+say)?|\s+to|\s+is|:)\s+["“]?(.+?)["”]?$/i,
    ) ||
    tailAfter(text, /\bmake (?:the |my )?(?:heading|headline|title)\s+["“]?(.+?)["”]?$/i) ||
    (/\b(heading|headline|title)\b/i.test(text) ? quote : null);
  if (headingValue && currentHero && currentHero.type === "hero") {
    currentHero.heading = clipCopy(headingValue).slice(0, 200);
    notes.push("Updated the homepage headline.");
  }

  const taglineValue =
    tailAfter(
      text,
      /\b(?:tagline|subtitle|subheading)(?:\s+should(?:\s+be|\s+say)?|\s+to|\s+is|:)\s+["“]?(.+?)["”]?$/i,
    ) ||
    tailAfter(text, /\bmake (?:the |my )?(?:tagline|subtitle|subheading)\s+["“]?(.+?)["”]?$/i) ||
    (/\b(tagline|subtitle|subheading)\b/i.test(text) ? quote : null);
  if (taglineValue) {
    const value = clipCopy(taglineValue).slice(0, 200);
    next.identity.tagline = value;
    const liveHero = hero(next);
    if (liveHero && liveHero.type === "hero") liveHero.subheading = value;
    notes.push("Updated the tagline.");
  }

  const aboutValue =
    tailAfter(text, /\b(?:about|bio|story)(?:\s+should(?:\s+be|\s+say)?|\s+to|\s+is|:)\s+["“]?(.+?)["”]?$/i) ||
    (/\b(about|bio|story)\b/i.test(text) ? quote : null);
  if (aboutValue) {
    const block = about(next);
    if (block && block.type === "richtext") {
      block.body = clipCopy(aboutValue).slice(0, 4000);
      notes.push("Updated the about section.");
    }
  }

  const kickerValue = tailAfter(text, /\bkicker(?:\s+should(?:\s+be|\s+say)?|\s+to|\s+is|:)\s+["“]?(.+?)["”]?$/i);
  if (kickerValue) {
    const liveHero = hero(next);
    if (liveHero && liveHero.type === "hero") {
      liveHero.kicker = kickerValue.slice(0, 80);
      notes.push("Updated the kicker.");
    }
  }

  const builders = sectionBuilders();
  if (/\badd (?:an? |a )?(?:testimonial|review)/i.test(text)) {
    upsertSection(next, builders.testimonials);
    notes.push("Added a testimonials section.");
  }
  if (/\badd (?:an? )?faq/i.test(text)) {
    upsertSection(next, builders.faq);
    notes.push("Added an FAQ.");
  }
  if (/\badd (?:a )?(?:pricing|prices|menu of prices|membership)/i.test(text)) {
    upsertSection(next, builders.pricing);
    notes.push("Added a pricing section.");
  }
  if (/\badd (?:a |an )?(?:gallery|photos|images)\b/i.test(text)) {
    upsertSection(next, builders.gallery);
    notes.push("Added a gallery.");
  }
  if (/\badd (?:a |the )?team\b/i.test(text)) {
    upsertSection(next, builders.team);
    notes.push("Added a team section.");
  }
  if (/\badd (?:a |an )?(?:cta|call to action|booking)\b/i.test(text)) {
    upsertSection(next, builders.cta);
    notes.push("Added a call to action.");
  }
  if (/\badd (?:a |an )?stats?\b/i.test(text)) {
    upsertSection(next, builders.stats);
    notes.push("Added stats.");
  }

  const remove = text.match(/\b(?:remove|delete|hide|get rid of)\s+(?:the |an? )?([a-z ]{3,40})/i);
  if (remove?.[1]) {
    const token = remove[1].toLowerCase();
    const typeMap: Record<string, SiteSection["type"]> = {
      faq: "faq",
      pricing: "pricing",
      testimonial: "testimonials",
      testimonials: "testimonials",
      gallery: "gallery",
      team: "team",
      stats: "stats",
      cta: "cta",
    };
    const type = Object.entries(typeMap).find(([key]) => token.includes(key))?.[1];
    const page = next.pages[0];
    if (type && page) {
      const before = page.sections.length;
      page.sections = page.sections.filter((section) => section.type !== type);
      if (page.sections.length < before) notes.push(`Removed the ${type} section.`);
    }
  }

  if (notes.length === 0) {
    const liveHero = hero(next);
    const block = about(next);
    const brief = text.replace(/^(please\s+)?((can|could) you\s+)?/i, "").trim().slice(0, 600);
    if (liveHero && liveHero.type === "hero") {
      liveHero.subheading = brief;
    }
    if (block && block.type === "richtext") {
      block.body = brief.slice(0, 4000);
    }
    next.identity.tagline = brief.slice(0, 200);
    next.seo.description = brief.slice(0, 300);
    notes.push("Updated the live page to match what you asked.");
  }

  next.updatedAt = new Date().toISOString();
  return {
    site: parseSite(next),
    reply: `${notes.join(" ")} It is live on your private site now.`,
    changed: true,
  };
}
