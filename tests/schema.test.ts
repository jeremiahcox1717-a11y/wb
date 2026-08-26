import { describe, expect, it } from "vitest";
import { applyLocalDesign } from "@/lib/ai/local-designer";
import { tryFactualAnswer } from "@/lib/ai/answer";
import { defaultSite } from "@/lib/default-site";
import { parseSite } from "@/lib/schema";
import { templates } from "@/lib/ai/templates";

describe("local designer", () => {
  it("rebuilds the site as a bakery immediately", () => {
    const { site, reply } = applyLocalDesign(defaultSite(), "Turn this into a bakery called Hearth & Crumb");
    expect(site.identity.siteName).toBe("Hearth & Crumb");
    expect(site.theme.background).toBe("#f6f1e7");
    expect(site.pages[0]?.sections.some((section) => section.type === "features")).toBe(true);
    expect(reply.toLowerCase()).toMatch(/live/);
  });

  it("applies a palette without wiping the business", () => {
    const bakery = applyLocalDesign(defaultSite(), "make this a coffee shop").site;
    const { site } = applyLocalDesign(bakery, "use a rose palette");
    expect(site.identity.tagline.toLowerCase()).toMatch(/coffee/);
    expect(site.theme.accent).toBe("#f3b4c2");
  });

  it("records contact details from a sentence", () => {
    const { site } = applyLocalDesign(
      defaultSite(),
      "my email is hello@example.com and the phone is 555-010-0199",
    );
    expect(site.identity.email).toBe("hello@example.com");
    expect(site.identity.phone).toMatch(/555/);
  });

  it("adds sections on request", () => {
    const { site } = applyLocalDesign(defaultSite(), "add an FAQ and add pricing");
    const types = site.pages[0]?.sections.map((section) => section.type) ?? [];
    expect(types).toContain("faq");
    expect(types).toContain("pricing");
  });

  it("builds a fresh personal site when asked to build a website", () => {
    const { site, reply, changed } = applyLocalDesign(defaultSite(), "build me a website");
    expect(changed).toBe(true);
    expect(site.identity.ownerName).toBe("Jordan Bennett");
    expect(site.identity.siteName).toBe("Jordan Bennett");
    expect(reply.toLowerCase()).toMatch(/fresh|scratch|live/);
  });

  it("builds from scratch in white and blue without treating colors as a business", () => {
    const { site, changed, reply } = applyLocalDesign(
      defaultSite(),
      "build a website and make it white and blue",
    );
    expect(changed).toBe(true);
    expect(site.identity.ownerName).toBe("Jordan Bennett");
    expect(site.identity.tagline.toLowerCase()).not.toMatch(/white and blue/);
    expect(site.theme.background.toLowerCase()).toBe("#f7f7f4");
    expect(site.theme.accent.toLowerCase()).toBe("#1d4e89");
    expect(reply.toLowerCase()).toMatch(/white|blue|live/);
  });

  it("answers questions without rewriting the site", () => {
    const base = defaultSite();
    const { site, reply, changed } = applyLocalDesign(base, "How does the URL scanner work?");
    expect(changed).toBe(false);
    expect(site.identity.tagline).toBe(base.identity.tagline);
    expect(reply.toLowerCase()).toMatch(/yes|safe|url/);
    const hero = site.pages[0]?.sections.find((section) => section.type === "hero");
    expect(hero && hero.type === "hero" ? hero.subheading : "").not.toMatch(/URL scanner work/i);
  });

  it("does not treat a greeting as a homepage brief", () => {
    const base = defaultSite();
    const { site, changed } = applyLocalDesign(base, "hello");
    expect(changed).toBe(false);
    expect(site.identity.tagline).toBe(base.identity.tagline);
  });

  it("answers the time without changing the site", () => {
    const now = new Date("2026-08-25T04:58:00.000Z");
    const reply = tryFactualAnswer(defaultSite(), "whats the time", now);
    expect(reply).toMatch(/2026/);
    expect(reply).toMatch(/London|UTC|Toronto/i);
    const { site, changed } = applyLocalDesign(defaultSite(), "What's the time?");
    expect(changed).toBe(false);
    expect(site.identity.siteName).toBe("Jordan Bennett");
  });

  it("applies a heading change without an AI key", () => {
    const { site, changed, reply } = applyLocalDesign(defaultSite(), "make the heading Hello From Jordan");
    expect(changed).toBe(true);
    const hero = site.pages[0]?.sections.find((section) => section.type === "hero");
    expect(hero && hero.type === "hero" ? hero.heading : "").toBe("Hello From Jordan");
    expect(reply.toLowerCase()).toMatch(/live/);
  });

  it("applies a color and a business that is not a canned template", () => {
    const { site, changed } = applyLocalDesign(defaultSite(), "make this a barbershop with gold colors");
    expect(changed).toBe(true);
    expect(site.identity.tagline.toLowerCase()).toMatch(/barber/);
    expect(site.theme.background.toLowerCase()).toMatch(/#/);
  });

  it("adds a gallery when asked", () => {
    const { site } = applyLocalDesign(defaultSite(), "add a gallery");
    expect(site.pages[0]?.sections.some((section) => section.type === "gallery")).toBe(true);
  });

  it("does not rewrite the site when asked how to customize", () => {
    const base = defaultSite();
    const { site, changed } = applyLocalDesign(base, "How do I change the heading?");
    expect(changed).toBe(false);
    expect(site.identity.tagline).toBe(base.identity.tagline);
  });

  it("does simple math when asked", () => {
    expect(tryFactualAnswer(defaultSite(), "what's 12 * 8")).toBe("12 × 8 = 96");
  });

  it("every built-in template is valid site JSON", () => {
    const base = defaultSite();
    for (const build of Object.values(templates)) {
      expect(() => parseSite(build(base))).not.toThrow();
    }
  });
});
