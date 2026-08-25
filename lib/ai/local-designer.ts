import { palettes } from "../default-site";
import type { Site, SiteSection } from "../schema";
import { parseSite } from "../schema";
import { templateMatchers, templates } from "./templates";

const PALETTE_WORDS: { key: keyof typeof palettes; re: RegExp }[] = [
  { key: "linen", re: /\b(linen|cream|warm paper|beige|bakery[- ]?like)\b/i },
  { key: "ocean", re: /\b(ocean|teal|aqua|sea|blue)\b/i },
  { key: "noir", re: /\b(noir|black and white|monochrome|minimal black)\b/i },
  { key: "orchard", re: /\b(green|forest|orchard|olive)\b/i },
  { key: "rose", re: /\b(rose|pink|blush|magenta)\b/i },
  { key: "paper", re: /\b(paper|editorial|newspaper|light mode|bright)\b/i },
  { key: "copper", re: /\b(copper|gold|bronze|amber)\b/i },
];

function clone(site: Site): Site {
  return parseSite(JSON.parse(JSON.stringify(site)));
}

function hero(site: Site) {
  return site.pages[0]?.sections.find((section) => section.type === "hero");
}

function upsertSection(site: Site, section: SiteSection) {
  const page = site.pages[0];
  if (!page) return;
  const index = page.sections.findIndex((item) => item.type === section.type);
  const footerIndex = page.sections.findIndex((item) => item.type === "footer");
  if (index >= 0) {
    page.sections[index] = section;
    return;
  }
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

export function applyLocalDesign(site: Site, message: string): { site: Site; reply: string } {
  const text = message.trim();
  if (!text) {
    return { site, reply: "Tell me what to change and I will update your private site immediately." };
  }

  let next = clone(site);
  const notes: string[] = [];

  const template = templateMatchers.find((item) => item.re.test(text));
  if (template) {
    next = templates[template.name](next);
    notes.push(`Rebuilt your private site as a ${template.label}.`);
  }

  const palette = PALETTE_WORDS.find((item) => item.re.test(text));
  if (palette) {
    next.theme = { ...next.theme, ...palettes[palette.key] };
    notes.push(`Applied the ${palettes[palette.key].label} palette.`);
  } else if (/\b(dark(?:er)?|night|black background)\b/i.test(text) && !template) {
    next.theme = { ...next.theme, ...palettes.noir };
    notes.push("Switched the site to a dark noir palette.");
  } else if (/\b(light(?:er)?|daylight|white background)\b/i.test(text) && !template) {
    next.theme = { ...next.theme, ...palettes.paper };
    notes.push("Switched the site to a light paper palette.");
  }

  const named = text.match(/\b(?:call(?:ed)? it|rename(?:d)? (?:it )?to|site name(?: is| to)?|brand(?:ed)? as)\s+["“]?([A-Za-z0-9&'’.\- ]{2,60})["”]?/i);
  const myName = text.match(/\b(?:my name is|i(?:'| a)?m)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\b/);
  if (named?.[1]) {
    applyName(next, named[1].trim().replace(/[.]+$/, ""));
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

  if (/\badd (?:an? |a )?testimonial/i.test(text)) {
    upsertSection(next, {
      type: "testimonials",
      heading: "Kind words",
      items: [
        { quote: "Replace this with a real customer line.", name: "A. Neighbor" },
        { quote: "Ask the studio for more quotes whenever you have them.", name: "A. Guest" },
      ],
    });
    notes.push("Added a testimonials section.");
  }

  if (/\badd (?:an? )?faq/i.test(text)) {
    upsertSection(next, {
      type: "faq",
      heading: "Questions",
      items: [
        { question: "Can anyone else view this site?", answer: "No. The whole site is locked behind your owner password." },
        { question: "How fast do changes go live?", answer: "Immediately. Your private page reads the same file the studio just wrote." },
      ],
    });
    notes.push("Added an FAQ.");
  }

  if (/\badd pricing|add (?:a )?menu of prices|add membership/i.test(text)) {
    upsertSection(next, {
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
    });
    notes.push("Added a pricing section.");
  }

  const headingChange = text.match(/\b(?:heading|title|headline)(?: should (?:be|say)| to| is|:)\s+["“]?(.+?)["”]?$/i);
  if (headingChange?.[1]) {
    const current = hero(next);
    if (current && current.type === "hero") {
      current.heading = headingChange[1].trim().slice(0, 200);
      notes.push("Updated the homepage headline.");
    }
  }

  const taglineChange = text.match(/\b(?:tagline|subtitle|subheading)(?: should (?:be|say)| to| is|:)\s+["“]?(.+?)["”]?$/i);
  if (taglineChange?.[1]) {
    const value = taglineChange[1].trim().slice(0, 200);
    next.identity.tagline = value;
    const current = hero(next);
    if (current && current.type === "hero") current.subheading = value;
    notes.push("Updated the tagline.");
  }

  if (notes.length === 0) {
    if (/\b(?:build|make|create|design)\b.+\b(?:web ?site|site|page|homepage)\b/i.test(text)) {
      notes.push(
        "I can build it. Tell me the kind of site — bakery, coffee shop, restaurant, gym, portfolio, or design studio — and I will rebuild this page for you.",
      );
    } else {
      const current = hero(next);
      if (current && current.type === "hero") {
        current.subheading = text.slice(0, 400);
        next.identity.tagline = text.slice(0, 200);
        notes.push("I treated that as a homepage brief and updated the live subheading.");
      } else {
        notes.push("I heard you, but I need a more specific change — a business type, a color, a name, or a section to add.");
      }
    }
    notes.push("Paste an AI key in studio settings if you want deeper rewrites from a language model.");
  }

  next.updatedAt = new Date().toISOString();
  return {
    site: parseSite(next),
    reply: `${notes.join(" ")} It is live on your private site now.`,
  };
}
