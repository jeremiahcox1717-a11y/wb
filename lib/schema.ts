import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
});

const themeSchema = z.object({
  background: z.string().min(1).max(80),
  surface: z.string().min(1).max(80),
  text: z.string().min(1).max(80),
  muted: z.string().min(1).max(80),
  accent: z.string().min(1).max(80),
  accentText: z.string().min(1).max(80),
  border: z.string().min(1).max(80),
  fontDisplay: z.string().min(1).max(80),
  fontBody: z.string().min(1).max(80),
  radius: z.enum(["sharp", "soft", "round"]),
});

const identitySchema = z.object({
  siteName: z.string().min(1).max(80),
  ownerName: z.string().min(1).max(80),
  tagline: z.string().max(200).optional().default(""),
  email: z.string().max(200).optional(),
  phone: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  socials: z.array(linkSchema).max(12).default([]),
});

const heroSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("hero"),
  layout: z.enum(["cinematic", "split", "centered", "editorial"]).optional(),
  kicker: z.string().max(80).optional(),
  heading: z.string().min(1).max(200),
  subheading: z.string().max(600).optional(),
  image: z.string().max(1000).optional(),
  primaryCta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
});

const featuresSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("features"),
  heading: z.string().max(160).optional(),
  subheading: z.string().max(400).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        body: z.string().min(1).max(400),
      }),
    )
    .max(12),
});

const richtextSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("richtext"),
  heading: z.string().max(160).optional(),
  eyebrow: z.string().max(80).optional(),
  body: z.string().min(1).max(4000),
});

const gallerySectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("gallery"),
  heading: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        title: z.string().max(80).optional(),
        caption: z.string().max(200).optional(),
        image: z.string().min(1).max(1000),
      }),
    )
    .max(12),
});

const testimonialsSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("testimonials"),
  heading: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        quote: z.string().min(1).max(500),
        name: z.string().min(1).max(80),
        role: z.string().max(80).optional(),
      }),
    )
    .max(12),
});

const pricingSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("pricing"),
  heading: z.string().max(160).optional(),
  subheading: z.string().max(400).optional(),
  plans: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        price: z.string().min(1).max(40),
        description: z.string().max(200).optional(),
        featured: z.boolean().optional(),
        features: z.array(z.string().max(120)).max(12),
        cta: linkSchema.optional(),
      }),
    )
    .max(6),
});

const faqSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("faq"),
  heading: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(200),
        answer: z.string().min(1).max(800),
      }),
    )
    .max(16),
});

const statsSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("stats"),
  items: z
    .array(
      z.object({
        value: z.string().min(1).max(24),
        label: z.string().min(1).max(80),
      }),
    )
    .max(8),
});

const ctaSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("cta"),
  heading: z.string().min(1).max(160),
  body: z.string().max(400).optional(),
  cta: linkSchema,
});

const contactSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("contact"),
  heading: z.string().max(160).optional(),
  body: z.string().max(400).optional(),
});

const teamSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("team"),
  heading: z.string().max(160).optional(),
  members: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        role: z.string().max(80).optional(),
        bio: z.string().max(300).optional(),
      }),
    )
    .max(12),
});

const footerSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("footer"),
  note: z.string().max(200).optional(),
});

const urlScannerSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("urlScanner"),
  heading: z.string().max(160).optional(),
  body: z.string().max(400).optional(),
});

const nameScannerSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("nameScanner"),
  heading: z.string().max(160).optional(),
  body: z.string().max(400).optional(),
});

const currencyCalculatorSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("currencyCalculator"),
  heading: z.string().max(160).optional(),
  body: z.string().max(400).optional(),
});

const notebookSectionSchema = z.object({
  id: z.string().max(80).optional(),
  type: z.literal("notebook"),
  heading: z.string().max(160).optional(),
  body: z.string().max(400).optional(),
});

export const sectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  featuresSectionSchema,
  richtextSectionSchema,
  gallerySectionSchema,
  testimonialsSectionSchema,
  pricingSectionSchema,
  faqSectionSchema,
  statsSectionSchema,
  ctaSectionSchema,
  contactSectionSchema,
  teamSectionSchema,
  urlScannerSectionSchema,
  nameScannerSectionSchema,
  currencyCalculatorSectionSchema,
  notebookSectionSchema,
  footerSectionSchema,
]);

export const pageSchema = z.object({
  id: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(80),
  sections: z.array(sectionSchema).min(1).max(20),
});

export const siteSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().min(1),
  identity: identitySchema,
  seo: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(300),
  }),
  theme: themeSchema,
  nav: z.array(linkSchema).max(10),
  pages: z.array(pageSchema).min(1).max(12),
});

export type Site = z.infer<typeof siteSchema>;
export type SitePage = z.infer<typeof pageSchema>;
export type SiteSection = z.infer<typeof sectionSchema>;
export type SiteTheme = z.infer<typeof themeSchema>;

export function parseSite(input: unknown): Site {
  return siteSchema.parse(input);
}

export function radiusValue(radius: SiteTheme["radius"], kind: "card" | "button") {
  if (radius === "sharp") return "0px";
  if (radius === "round") return kind === "button" ? "999px" : "28px";
  return kind === "button" ? "999px" : "18px";
}
