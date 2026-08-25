import type { Site } from "../schema";

export function answerLocally(site: Site, message: string): string {
  const text = message.trim();
  const lower = text.toLowerCase();
  const name = site.identity.ownerName || site.identity.siteName || "the owner";

  if (/^(hi|hello|hey|yo|sup)\b/i.test(text)) {
    return `Hi ${name.split(" ")[0]}. Ask me a question, or tell me what to build on this private site.`;
  }

  if (/\b(thank|thanks|thx)\b/i.test(lower)) {
    return "You’re welcome. Ask another question whenever you want.";
  }

  if (/\b(what can you do|help|how (?:do i|does this) work|what is this)\b/i.test(lower)) {
    return [
      "You can ask me questions here, and I will answer.",
      "You can also tell me what website to build and I will update this private page.",
      "On the page: URL scanner (YES/NO), name scanner, currency converter (type or pick both currencies), and a notebook for names and contacts.",
    ].join(" ");
  }

  if (/\burl\b/i.test(lower) && /\bscan/i.test(lower)) {
    return "Paste a link in the URL section or here. YES means it looks safe to open. NO means do not open it. You can also type a name to make a clean URL.";
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
    return "Tell me the kind of site — bakery, coffee shop, restaurant, gym, portfolio — or a color/theme. I will rebuild the live page. Questions stay as answers and do not change the site.";
  }

  return [
    `I can answer questions, and I can rebuild this private site when you ask.`,
    site.identity.tagline ? `This page is “${site.identity.siteName}” — ${site.identity.tagline}` : `This page is “${site.identity.siteName}.”`,
    "Ask anything you want. For a full language-model conversation, add an AI key in Studio → Settings.",
  ].join(" ");
}
