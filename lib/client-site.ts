import { palettes } from "./default-site";
import { parseSite, type Site, type SiteSection } from "./schema";

const OWNER_TOOL_TYPES = new Set<SiteSection["type"]>([
  "urlMaker",
  "urlScanner",
  "nameScanner",
  "currencyCalculator",
  "notebook",
]);

const OWNER_NAV = new Set(["#url-make", "#url-scan", "#name-scan", "#currency", "#notebook"]);

const SKIP_CLIENT_WORDS = new Set([
  "other",
  "others",
  "people",
  "someone",
  "somebody",
  "anyone",
  "me",
  "myself",
  "them",
  "clients",
  "a client",
  "customers",
]);

export function isPlaceholderBrand(name: string) {
  return /^(new site|jordan bennett)$/i.test(name.trim());
}

export function blankClientSite(): Site {
  const theme = palettes.paper;
  return parseSite({
    version: 1,
    updatedAt: new Date().toISOString(),
    identity: {
      siteName: "New site",
      ownerName: "New site",
      tagline: "A new website for a client.",
      socials: [],
    },
    seo: {
      title: "New site",
      description: "A new website built for someone else.",
    },
    theme: {
      background: theme.background!,
      surface: theme.surface!,
      text: theme.text!,
      muted: theme.muted!,
      accent: theme.accent!,
      accentText: theme.accentText!,
      border: theme.border!,
      fontDisplay: theme.fontDisplay!,
      fontBody: theme.fontBody!,
      radius: theme.radius!,
    },
    nav: [
      { label: "Home", href: "/" },
      { label: "Work", href: "#work" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    pages: [
      {
        id: "home",
        slug: "/",
        title: "Home",
        sections: [
          {
            type: "hero",
            layout: "cinematic",
            kicker: "New website",
            heading: "New site",
            subheading: "A fresh page for someone else. Colors, name, and sections follow what you asked.",
            primaryCta: { label: "See more", href: "#work" },
            secondaryCta: { label: "Get in touch", href: "#contact" },
          },
          {
            id: "work",
            type: "features",
            heading: "What this site is for",
            items: [
              {
                title: "Built for a client",
                body: "This page is a separate website. It does not replace the owner’s private homepage.",
              },
              {
                title: "Public link",
                body: "Anyone with the link can open this site. Send it to the person it was built for.",
              },
              {
                title: "Ask for changes",
                body: "Tell the builder a heading, a color, a business type, or a section and this page updates.",
              },
            ],
          },
          {
            id: "about",
            type: "richtext",
            eyebrow: "About",
            heading: "A new page from scratch.",
            body: "Replace this with the client’s story. This is their website, not the owner’s private desk.",
          },
          {
            id: "contact",
            type: "contact",
            heading: "Say hello",
            body: "Add an email, phone, or city for this client and this block will fill itself in.",
          },
          { type: "footer", note: "A new website." },
        ],
      },
    ],
  });
}

export function stripOwnerTools(site: Site): Site {
  const next = parseSite(JSON.parse(JSON.stringify(site)));
  for (const page of next.pages) {
    page.sections = page.sections.filter((section) => !OWNER_TOOL_TYPES.has(section.type));
    for (const section of page.sections) {
      if (section.type !== "faq") continue;
      section.items = section.items.map((item) => {
        if (!/anyone else|password|private|locked|owner only/i.test(`${item.question} ${item.answer}`)) {
          return item;
        }
        return {
          question: "Who is this website for?",
          answer:
            "This is a public website built for a client. Anyone with the link can open it. The owner’s private homepage stays separate.",
        };
      });
    }
  }
  next.nav = next.nav.filter((item) => !OWNER_NAV.has(item.href));
  return parseSite(next);
}

export function extractClientLabel(text: string) {
  const named =
    text.match(/\b(?:called|named)\s+["“]?([A-Za-z0-9&'’.\-][A-Za-z0-9&'’.\- ]{1,58})["”]?/i)?.[1] ||
    text.match(/\bsite name(?:\s+is|\s+to)?\s+["“]?([A-Za-z0-9&'’.\-][A-Za-z0-9&'’.\- ]{1,58})["”]?/i)?.[1];
  if (named) return named.replace(/[.]+$/, "").trim();

  const forName = text.match(/\bfor\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\b/)?.[1];
  if (forName && !SKIP_CLIENT_WORDS.has(forName.toLowerCase())) return forName.trim();
  return null;
}

export function applyClientIdentity(site: Site, message: string): Site {
  const next = stripOwnerTools(site);
  const label = extractClientLabel(message);
  if (label) {
    next.identity.siteName = label.slice(0, 80);
    next.identity.ownerName = label.slice(0, 80);
    next.seo.title = label.slice(0, 120);
    const hero = next.pages[0]?.sections.find((section) => section.type === "hero");
    if (hero && hero.type === "hero" && isPlaceholderBrand(hero.heading)) {
      hero.heading = label.slice(0, 200);
    }
    const footer = next.pages[0]?.sections.find((section) => section.type === "footer");
    if (footer && footer.type === "footer") footer.note = label.slice(0, 200);
  } else if (isPlaceholderBrand(next.identity.ownerName) && !isPlaceholderBrand(next.identity.siteName)) {
    next.identity.ownerName = next.identity.siteName;
  } else if (isPlaceholderBrand(next.identity.siteName) && next.identity.tagline) {
    next.identity.siteName = next.identity.tagline.slice(0, 80) || next.identity.siteName;
  }
  return parseSite(next);
}

export function publicPathFor(slug: string) {
  return `/s/${slug}`;
}
