import { palettes } from "../default-site";
import type { Site, SiteSection } from "../schema";

function stamp(site: Omit<Site, "updatedAt" | "version">): Site {
  return { ...site, version: 1, updatedAt: new Date().toISOString() };
}

function keepIdentity(previous: Site, nextName?: string) {
  return {
    ...previous.identity,
    siteName: nextName || previous.identity.siteName,
    ownerName: previous.identity.ownerName,
  };
}

export const templates = {
  bakery(previous: Site): Site {
    const name = previous.identity.siteName.includes("Bennett") ? "Hearth & Crumb" : previous.identity.siteName;
    return stamp({
      identity: {
        ...keepIdentity(previous, name),
        siteName: name,
        tagline: "Bread, pastry, and the long morning.",
      },
      seo: {
        title: `${name} · Bakery`,
        description: "A neighborhood bakery for daily bread, laminated pastry, and coffee at the counter.",
      },
      theme: { ...previous.theme, ...palettes.linen },
      nav: [
        { label: "Home", href: "/" },
        { label: "Menu", href: "#menu" },
        { label: "Visit", href: "#contact" },
      ],
      pages: [
        {
          id: "home",
          slug: "/",
          title: "Home",
          sections: [
            {
              type: "hero",
              layout: "editorial",
              kicker: "Neighborhood bakery",
              heading: name,
              subheading: "Warm loaves at dawn, fruit tarts by noon, and a quiet table by the window.",
              primaryCta: { label: "See today’s menu", href: "#menu" },
              secondaryCta: { label: "Hours & location", href: "#contact" },
            },
            {
              id: "menu",
              type: "features",
              heading: "From the ovens",
              items: [
                { title: "Country loaf", body: "Wild yeast, long ferment, crackling crust. Baked every morning." },
                { title: "Morning pastry", body: "Butter croissants, kouign-amann, and rotating seasonal danishes." },
                { title: "Cakes to order", body: "Layer cakes and celebration tarts. Ask two days ahead." },
              ],
            },
            {
              type: "testimonials",
              heading: "From the counter",
              items: [
                { quote: "The sesame loaf disappeared before we got home.", name: "Mara K.", role: "Saturday regular" },
                { quote: "It smells like a holiday in here, every weekday.", name: "Eli P." },
              ],
            },
            {
              id: "contact",
              type: "contact",
              heading: "Come by",
              body: "Open Wednesday–Sunday, 8–2. Add your street address in the studio to finish this page.",
            },
            { type: "footer", note: `${name} · baked daily` },
          ],
        },
      ],
    });
  },

  coffee(previous: Site): Site {
    const name = previous.identity.siteName.includes("Bennett") ? "Northroom Coffee" : previous.identity.siteName;
    return stamp({
      identity: {
        ...keepIdentity(previous, name),
        siteName: name,
        tagline: "Coffee, slow service, a table for lingering.",
      },
      seo: {
        title: `${name}`,
        description: "A calm coffee bar for pour-overs, milk drinks, and a few things to eat.",
      },
      theme: { ...previous.theme, ...palettes.ocean },
      nav: [
        { label: "Home", href: "/" },
        { label: "Drinks", href: "#drinks" },
        { label: "Visit", href: "#contact" },
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
              kicker: "Coffee bar",
              heading: name,
              subheading: "Single-origin pour-overs, quiet music, and a window that faces the morning.",
              primaryCta: { label: "The drinks", href: "#drinks" },
            },
            {
              id: "drinks",
              type: "features",
              heading: "On bar",
              items: [
                { title: "Pour-over", body: "A rotating guest espresso and a house filter blend." },
                { title: "Milk drinks", body: "Cortado, cappuccino, and a seasonal spice latte." },
                { title: "A little food", body: "Toast, a bun, and one cake by the slice." },
              ],
            },
            {
              type: "stats",
              items: [
                { value: "7am", label: "First shot pulled" },
                { value: "2", label: "Roasters on the bar" },
                { value: "Wi-Fi", label: "If you need it" },
              ],
            },
            {
              id: "contact",
              type: "contact",
              heading: "Find us",
              body: "Tell the studio your hours and street and this block will catch up.",
            },
            { type: "footer", note: `${name}` },
          ],
        },
      ],
    });
  },

  portfolio(previous: Site): Site {
    const name = previous.identity.ownerName;
    return stamp({
      identity: {
        ...keepIdentity(previous, name),
        siteName: name,
        tagline: "Selected work and notes.",
      },
      seo: {
        title: `${name} · Work`,
        description: `Selected work by ${name}.`,
      },
      theme: { ...previous.theme, ...palettes.noir },
      nav: [
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
              layout: "editorial",
              kicker: "Portfolio",
              heading: name,
              subheading: "Designer, maker, and careful editor of the things that go out into the world.",
              primaryCta: { label: "Selected work", href: "#work" },
            },
            {
              id: "work",
              type: "features",
              heading: "Selected work",
              items: [
                { title: "Project One", body: "Replace this with a real engagement — the problem, the constraint, the outcome." },
                { title: "Project Two", body: "A second piece. Ask the studio to add images, a case study page, or a gallery." },
                { title: "Project Three", body: "Keep this list short. Three true things beat twelve vague ones." },
              ],
            },
            {
              id: "about",
              type: "richtext",
              eyebrow: "About",
              heading: "A short bio belongs here.",
              body: "Write like a person. Where you work, what you care about, what you will not do. The studio can lengthen or cut this whenever you want.",
            },
            {
              id: "contact",
              type: "contact",
              heading: "Commission / collaborate",
              body: "Add an email and this page becomes usable today.",
            },
            { type: "footer", note: name },
          ],
        },
      ],
    });
  },

  restaurant(previous: Site): Site {
    const name = previous.identity.siteName.includes("Bennett") ? "Supper House" : previous.identity.siteName;
    return stamp({
      identity: {
        ...keepIdentity(previous, name),
        siteName: name,
        tagline: "A small room, a seasonal menu.",
      },
      seo: {
        title: `${name} · Restaurant`,
        description: "A neighborhood restaurant. Seasonal plates, a short wine list, reservations preferred.",
      },
      theme: { ...previous.theme, ...palettes.rose },
      nav: [
        { label: "Menu", href: "#menu" },
        { label: "Reservations", href: "#contact" },
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
              kicker: "Dinner",
              heading: name,
              subheading: "A short menu that changes with the market. Come hungry, leave unhurried.",
              primaryCta: { label: "Tonight’s menu", href: "#menu" },
              secondaryCta: { label: "Reserve", href: "#contact" },
            },
            {
              id: "menu",
              type: "features",
              heading: "A few plates",
              items: [
                { title: "First", body: "Chilled vegetables, good oil, bread still warm from the hearth." },
                { title: "Then", body: "A fish or a bird, depending on the morning’s market." },
                { title: "After", body: "A tart, a cheese, something cold and sweet." },
              ],
            },
            {
              type: "cta",
              heading: "Reservations for the room",
              body: "We keep a few seats for walk-ins after nine.",
              cta: { label: "Book a table", href: "#contact" },
            },
            {
              id: "contact",
              type: "contact",
              heading: "The house",
              body: "Dinner Wednesday–Saturday from 5:30. Add your address and booking link in the studio.",
            },
            { type: "footer", note: `${name}` },
          ],
        },
      ],
    });
  },

  fitness(previous: Site): Site {
    const name = previous.identity.siteName.includes("Bennett") ? "Ironroom" : previous.identity.siteName;
    return stamp({
      identity: {
        ...keepIdentity(previous, name),
        siteName: name,
        tagline: "Strength training. No theater.",
      },
      seo: {
        title: `${name} · Training`,
        description: "Small-group strength training and personal coaching.",
      },
      theme: { ...previous.theme, ...palettes.orchard },
      nav: [
        { label: "Training", href: "#training" },
        { label: "Pricing", href: "#pricing" },
        { label: "Join", href: "#contact" },
      ],
      pages: [
        {
          id: "home",
          slug: "/",
          title: "Home",
          sections: [
            {
              type: "hero",
              layout: "split",
              kicker: "Strength club",
              heading: name,
              subheading: "Coached barbell work, honest programming, and a room that stays quiet on purpose.",
              primaryCta: { label: "See memberships", href: "#pricing" },
            },
            {
              id: "training",
              type: "features",
              heading: "How we train",
              items: [
                { title: "Small groups", body: "Six people, a coach, and a plan that lasts longer than a month." },
                { title: "Personal", body: "One-to-one sessions for technique, rehab, or a meet." },
                { title: "Open floor", body: "Members can lift on their own after the first cycle." },
              ],
            },
            {
              id: "pricing",
              type: "pricing",
              heading: "Memberships",
              plans: [
                {
                  name: "Group",
                  price: "$139/mo",
                  description: "Three coached sessions a week.",
                  features: ["Program included", "Coach in the room", "Open floor after 6 weeks"],
                  cta: { label: "Start", href: "#contact" },
                },
                {
                  name: "Personal",
                  price: "$90",
                  description: "Single session.",
                  featured: true,
                  features: ["60 minutes", "Movement screen", "Homework if you want it"],
                  cta: { label: "Book", href: "#contact" },
                },
              ],
            },
            {
              id: "contact",
              type: "contact",
              heading: "Come lift",
              body: "Tell us where you are starting. Add a phone number in the studio so this is real.",
            },
            { type: "footer", note: name },
          ],
        },
      ],
    });
  },

  agency(previous: Site): Site {
    const name = previous.identity.siteName.includes("Bennett") ? "Field Office" : previous.identity.siteName;
    return stamp({
      identity: {
        ...keepIdentity(previous, name),
        siteName: name,
        tagline: "A small studio for brands that want to be clear.",
      },
      seo: {
        title: `${name} · Studio`,
        description: "Brand, web, and campaign work for teams who prefer fewer slides and better sentences.",
      },
      theme: { ...previous.theme, ...palettes.paper },
      nav: [
        { label: "Work", href: "#work" },
        { label: "Services", href: "#services" },
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
              layout: "centered",
              kicker: "Design studio",
              heading: name,
              subheading: "Identity, websites, and campaigns with a short chain of command.",
              primaryCta: { label: "Start a project", href: "#contact" },
            },
            {
              id: "services",
              type: "features",
              heading: "What we take on",
              items: [
                { title: "Identity", body: "Names, type, color, and the rules so other people can use them." },
                { title: "Websites", body: "Public pages that load quickly and read like they were written by someone." },
                { title: "Campaigns", body: "A launch, a fundraise, a season. We will tell you if you do not need one." },
              ],
            },
            {
              type: "faq",
              heading: "Before we start",
              items: [
                { question: "Do you work with early teams?", answer: "Yes, if there is a real product and a person who can decide." },
                { question: "Fixed price?", answer: "Usually. We would rather agree on a room than bill by the hour." },
              ],
            },
            {
              id: "contact",
              type: "contact",
              heading: "A short brief is enough",
              body: "What you are making, when it has to ship, and who decides.",
            },
            { type: "footer", note: name },
          ],
        },
      ],
    });
  },
} satisfies Record<string, (previous: Site) => Site>;

export type TemplateName = keyof typeof templates;

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function genericBusiness(previous: Site, kind: string): Site {
  const label = kind.trim().replace(/\s+/g, " ").slice(0, 60) || "studio";
  const titled = titleCase(label);
  const name = previous.identity.siteName.includes("Bennett") ? titled : previous.identity.siteName;
  return stamp({
    identity: {
      ...keepIdentity(previous, name),
      siteName: name,
      tagline: `${titled} — built to match what you asked.`,
    },
    seo: {
      title: `${name} · ${titled}`,
      description: `${name} is a ${label}. The page follows what you asked the builder.`,
    },
    theme: previous.theme,
    nav: [
      { label: "Home", href: "/" },
      { label: "Work", href: "#work" },
      { label: "Visit", href: "#contact" },
    ],
    pages: [
      {
        id: "home",
        slug: "/",
        title: "Home",
        sections: [
          {
            type: "hero",
            layout: "editorial",
            kicker: titled,
            heading: name,
            subheading: `A ${label} page. Ask for another color, heading, or section and it updates live.`,
            primaryCta: { label: "See the work", href: "#work" },
            secondaryCta: { label: "Get in touch", href: "#contact" },
          },
          {
            id: "work",
            type: "features",
            heading: `What this ${label} offers`,
            items: [
              { title: "The offer", body: `Say what this ${label} actually sells and this card will be rewritten.` },
              { title: "How it feels", body: "Ask for luxury, quiet, loud, or a specific color and the theme follows." },
              { title: "Next step", body: "Add pricing, an FAQ, a team, or a booking line whenever you want." },
            ],
          },
          {
            id: "about",
            type: "richtext",
            eyebrow: "About",
            heading: name,
            body: `${name} runs a ${label}. Replace this paragraph with your story, hours, and the thing you want people to do next.`,
          },
          {
            id: "contact",
            type: "contact",
            heading: "Visit / enquire",
            body: "Add an email, phone, or city and this block fills in.",
          },
          { type: "footer", note: name },
        ],
      },
    ],
  });
}

export const templateMatchers: { name: TemplateName; re: RegExp; label: string }[] = [
  { name: "bakery", re: /\b(baker(?:y)?|pastr(?:y|ies)|bread|croissant|cake shop)\b/i, label: "bakery" },
  { name: "coffee", re: /\b(coffee|caf[eé]|espresso|pour[- ]?over)\b/i, label: "coffee shop" },
  { name: "restaurant", re: /\b(restaurant|bistro|dinner|eatery|supper)\b/i, label: "restaurant" },
  { name: "fitness", re: /\b(gym|fitness|workout|barbell|strength|training club)\b/i, label: "training gym" },
  { name: "agency", re: /\b(agency|brand studio|design studio|marketing studio)\b/i, label: "design studio" },
  { name: "portfolio", re: /\b(portfolio|personal site|resume|photographer|designer)\b/i, label: "portfolio" },
];

export function findSection<T extends SiteSection["type"]>(site: Site, type: T) {
  for (const page of site.pages) {
    const found = page.sections.find((section) => section.type === type);
    if (found && found.type === type) return found;
  }
  return undefined;
}
