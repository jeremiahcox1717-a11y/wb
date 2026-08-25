import type { Site } from "../schema";

const CLOCK_ZONES = [
  { id: "Europe/London", label: "London" },
  { id: "America/Toronto", label: "Toronto" },
  { id: "America/Vancouver", label: "Vancouver" },
  { id: "UTC", label: "UTC" },
] as const;

function formatStamp(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
}

function preferredZone(site: Site) {
  const location = `${site.identity.location || ""} ${site.identity.tagline || ""}`.toLowerCase();
  if (/\bvancouver|bc\b|british columbia/.test(location)) return CLOCK_ZONES[2];
  if (/\btoronto|ontario|montreal|ottawa|calgary|canada/.test(location)) return CLOCK_ZONES[1];
  if (/\blondon|uk\b|united kingdom|england|britain/.test(location)) return CLOCK_ZONES[0];
  return CLOCK_ZONES[0];
}

export function currentClock(site: Site, now = new Date()) {
  const main = preferredZone(site);
  const others = CLOCK_ZONES.filter((zone) => zone.id !== main.id);
  return {
    main: `${formatStamp(main.id, now)} in ${main.label}`,
    extra: others.map((zone) => `${formatStamp(zone.id, now)} ${zone.label}`).join(" · "),
    iso: now.toISOString(),
  };
}

export function tryFactualAnswer(site: Site, message: string, now = new Date()): string | null {
  const text = message.trim();
  const lower = text.toLowerCase().replace(/[’]/g, "'");

  const asksTime =
    /\b(what(?:'?s| is)|whats|tell me|do you know)\b.{0,24}\b(the )?time\b/.test(lower) ||
    /\bwhat time is it\b/.test(lower) ||
    /\bcurrent time\b/.test(lower) ||
    /\btime (?:is it|please|now)\b/.test(lower);
  const asksDate =
    /\b(what(?:'?s| is)|whats|tell me)\b.{0,24}\b(the )?(date|day)\b/.test(lower) ||
    /\bwhat day is it\b/.test(lower) ||
    /\bwhat(?:'?s| is) today\b/.test(lower);
  if (asksTime || asksDate) {
    const clock = currentClock(site, now);
    if (asksTime && !asksDate) {
      return `It's ${clock.main}. Also: ${clock.extra}.`;
    }
    if (asksDate && !asksTime) {
      return `Today is ${clock.main}.`;
    }
    return `It's ${clock.main}. Also: ${clock.extra}.`;
  }

  const math = lower
    .replace(/what(?:'?s| is)|whats|calculate|compute|=/g, " ")
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*([+\-x×*/])\s*(-?\d+(?:\.\d+)?)\s*\??$/);
  if (math) {
    const left = Number(math[1]);
    const right = Number(math[3]);
    const op = math[2];
    let value: number | null = null;
    if (op === "+") value = left + right;
    if (op === "-") value = left - right;
    if (op === "*" || op === "x" || op === "×") value = left * right;
    if ((op === "/" || op === "÷") && right !== 0) value = left / right;
    if (value !== null && Number.isFinite(value)) {
      const shown = op === "*" || op === "x" || op === "×" ? "×" : op;
      return `${left} ${shown} ${right} = ${Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))}`;
    }
  }

  return null;
}

export function answerLocally(site: Site, message: string): string {
  const fact = tryFactualAnswer(site, message);
  if (fact) return fact;

  const text = message.trim();
  const lower = text.toLowerCase();
  const name = site.identity.ownerName || site.identity.siteName || "the owner";

  if (/^(hi|hello|hey|yo|sup)\b/i.test(text)) {
    return `Hi ${name.split(" ")[0]}. Ask me anything — the time, a question, or what to build on this private site.`;
  }

  if (/\b(thank|thanks|thx)\b/i.test(lower)) {
    return "You’re welcome. Ask another question whenever you want.";
  }

  if (/\b(what can you do|help|how (?:do i|does this) work|what is this)\b/i.test(lower)) {
    return [
      "Ask me questions here. Try “what’s the time?”, money like 100 CAD to EUR, or “make a URL for Jordan Bennett”.",
      "You can also tell me any customization — colors, heading, business type, sections — and I will update this private page.",
      "On the page: URL maker (search then buy a real .com), URL scanner, name scanner, currency converter, and a notebook.",
    ].join(" ");
  }

  if (/\burl\b/i.test(lower) && /\bscan/i.test(lower)) {
    return "Paste a link in the URL section or here. YES means it looks safe to open. NO means do not open it.";
  }

  if (/\b(url maker|make (?:a |me a )?url|public domain|godaddy|\.com)\b/i.test(lower)) {
    return "Type a name in the URL maker. I search the public internet. If it is free, open Get on GoDaddy and buy it. After the registrar issues it, that address works on every phone, app, and browser. This site cannot charge a card or mint a live domain by itself.";
  }

  if (/\bname scan/i.test(lower) || /\bscan(?:ner)? a name\b/i.test(lower)) {
    return "Type a name in the name scanner. YES means someone else already uses it publicly. NO means no public match, or it is the owner of this site.";
  }

  if (/\b(currency|exchange|convert money|forex)\b/i.test(lower)) {
    return "In the currency section, type the from and to currencies (CAD, euros, pounds…) or pick them from the lists. Swap to convert the other way. Every live rate is listed underneath.";
  }

  if (/\bnotebook\b/i.test(lower)) {
    return "The notebook saves a person’s name, business, phone, and email on this private site. Only you can see that list.";
  }

  if (/\b(who owns|owner|whose site|site name|this site called)\b/i.test(lower)) {
    return `${name} owns this private site (${site.identity.siteName}). It is locked behind a password, so nobody else can open it.`;
  }

  if (/\b(password|private|who can see|locked)\b/i.test(lower)) {
    return "The whole website is private. Only someone with the owner password can open the pages, the studio, or the data.";
  }

  if (/\b(how (?:do i|can i) (?:change|edit|rebuild|make))\b/i.test(lower) || /\bbuild(?:er)? bot\b/i.test(lower)) {
    return "Tell me what to change — a bakery, a color, a heading, a new section — and I will update this private page. Questions stay as answers.";
  }

  const clock = currentClock(site);
    return [
      "I can answer that kind of question when a working AI key is in Studio → Settings.",
      `I can still tell you the time (it’s ${clock.main}), convert money, scan a URL, or customize this site if you ask.`,
    ].join(" ");
}
