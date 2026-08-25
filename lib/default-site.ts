import type { Site, SiteTheme } from "./schema";
import { ensureScannerSections } from "./scanner-sections";

export const palettes: Record<string, Partial<SiteTheme> & { label: string }> = {
  copper: {
    label: "copper",
    background: "#14110e",
    surface: "#1e1914",
    text: "#f4ece3",
    muted: "#b9a89a",
    accent: "#d4a574",
    accentText: "#1a140f",
    border: "#3a3128",
    fontDisplay: "Fraunces",
    fontBody: "Outfit",
    radius: "soft",
  },
  linen: {
    label: "linen",
    background: "#f6f1e7",
    surface: "#fffaf2",
    text: "#2a2118",
    muted: "#6d5e50",
    accent: "#9a4d2e",
    accentText: "#fff7ef",
    border: "#e2d5c4",
    fontDisplay: "Fraunces",
    fontBody: "Source Sans 3",
    radius: "soft",
  },
  ocean: {
    label: "ocean",
    background: "#07161d",
    surface: "#0e2430",
    text: "#e7f4f8",
    muted: "#9bb8c4",
    accent: "#7ad0d9",
    accentText: "#062027",
    border: "#1d3c4a",
    fontDisplay: "Playfair Display",
    fontBody: "Nunito Sans",
    radius: "soft",
  },
  noir: {
    label: "noir",
    background: "#0b0b0c",
    surface: "#161617",
    text: "#f3f3f1",
    muted: "#a3a39b",
    accent: "#f2f2f0",
    accentText: "#111111",
    border: "#2a2a2c",
    fontDisplay: "Cormorant Garamond",
    fontBody: "Manrope",
    radius: "sharp",
  },
  orchard: {
    label: "orchard",
    background: "#142116",
    surface: "#1d2e20",
    text: "#eef6e8",
    muted: "#b4c6ad",
    accent: "#d7e27a",
    accentText: "#162016",
    border: "#2f4634",
    fontDisplay: "Libre Baskerville",
    fontBody: "Figtree",
    radius: "soft",
  },
  rose: {
    label: "rose",
    background: "#2a1218",
    surface: "#3a1b24",
    text: "#fdecef",
    muted: "#e0b4bd",
    accent: "#f3b4c2",
    accentText: "#2a1218",
    border: "#5a2d38",
    fontDisplay: "Cormorant Garamond",
    fontBody: "Outfit",
    radius: "round",
  },
  paper: {
    label: "paper",
    background: "#f7f7f4",
    surface: "#ffffff",
    text: "#171717",
    muted: "#5c5c5c",
    accent: "#171717",
    accentText: "#f7f7f4",
    border: "#e4e4de",
    fontDisplay: "Newsreader",
    fontBody: "IBM Plex Sans",
    radius: "sharp",
  },
};

export function defaultSite(): Site {
  const theme = palettes.copper;
  return ensureScannerSections({
    version: 1,
    updatedAt: new Date().toISOString(),
    identity: {
      siteName: "Jordan Bennett",
      ownerName: "Jordan Bennett",
      tagline: "A living website. Tell it what to become.",
      location: "",
      socials: [],
    },
    seo: {
      title: "Jordan Bennett",
      description:
        "A personal site that can be redesigned in conversation. Public to the world, shaped in a private studio.",
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
            kicker: "Private site · owner only",
            heading: "Jordan Bennett",
            subheading:
              "This page is locked. Change the colors, the words, the whole business — it updates the moment you ask, and only you can see it.",
            primaryCta: { label: "See the work", href: "#work" },
            secondaryCta: { label: "Get in touch", href: "#contact" },
          },
          {
            id: "work",
            type: "features",
            heading: "What this space can hold",
            subheading:
              "Ask the studio to turn this into a bakery, a portfolio, a restaurant, or anything else.",
            items: [
              {
                title: "A private homepage",
                body: "The whole site asks for your password. Nobody else can open these pages.",
              },
              {
                title: "A locked studio",
                body: "Open /studio after you sign in. That is where you talk to the designer and save instantly.",
              },
              {
                title: "Live customizations",
                body: "Say “make it a coffee shop with ocean colors.” The live site becomes that, right away.",
              },
            ],
          },
          {
            id: "about",
            type: "richtext",
            eyebrow: "About",
            heading: "Start with a sentence. Keep going from there.",
            body: "Replace this with your story. Name the business. Add photos, pricing, testimonials, a contact section — or wipe it and begin again. Only you see the latest version.",
          },
          {
            type: "stats",
            items: [
              { value: "Live", label: "Saved the moment you send" },
              { value: "1", label: "Owner of the studio" },
              { value: "∞", label: "Directions this site can take" },
            ],
          },
          {
            id: "contact",
            type: "contact",
            heading: "Say hello",
            body: "Add your email, phone, or city in the studio and this block will fill itself in.",
          },
          {
            type: "footer",
            note: "Built in a private studio. Shown only to you.",
          },
        ],
      },
    ],
  });
}
