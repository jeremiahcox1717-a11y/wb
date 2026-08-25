import { describe, expect, it } from "vitest";
import { applyLocalDesign } from "@/lib/ai/local-designer";
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

  it("every built-in template is valid site JSON", () => {
    const base = defaultSite();
    for (const build of Object.values(templates)) {
      expect(() => parseSite(build(base))).not.toThrow();
    }
  });
});
