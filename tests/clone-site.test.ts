import { describe, expect, it } from "vitest";
import { cloneTargetUrl, siteFromHtml } from "@/lib/ai/clone-site";
import { defaultSite } from "@/lib/default-site";

const FIXTURE = `<!doctype html>
<html>
  <head>
    <title>North Star Labs</title>
    <meta name="description" content="We build quiet tools for private work." />
    <meta name="theme-color" content="#123456" />
  </head>
  <body>
    <h1>North Star Labs</h1>
    <p>We build quiet tools for private work and keep the rest of the page simple enough to clone.</p>
    <h2>Research</h2>
    <p>Another paragraph that is long enough to be used as feature copy on the rebuilt private site.</p>
    <img src="https://example.com/photo.jpg" alt="Studio desk" width="800" height="600" />
  </body>
</html>`;

describe("clone from public html", () => {
  it("rebuilds hero, copy, colors, and images while keeping the owner name", () => {
    const site = siteFromHtml(defaultSite(), FIXTURE, "https://northstar.example/work");
    expect(site.identity.ownerName).toBe("Jordan Bennett");
    expect(site.identity.siteName).toBe("North Star Labs");
    const hero = site.pages[0]?.sections.find((section) => section.type === "hero");
    expect(hero && hero.type === "hero" ? hero.heading : "").toBe("North Star Labs");
    expect(hero && hero.type === "hero" ? hero.kicker : "").toBe("northstar.example");
    expect(site.theme.background.toLowerCase()).toBe("#123456");
    const gallery = site.pages[0]?.sections.find((section) => section.type === "gallery");
    expect(gallery && gallery.type === "gallery" ? gallery.items[0]?.image : "").toBe(
      "https://example.com/photo.jpg",
    );
    const about = site.pages[0]?.sections.find((section) => section.type === "richtext");
    expect(about && about.type === "richtext" ? about.body : "").toMatch(/quiet tools/);
  });

  it("uses a previously pasted url when the owner says clone this", () => {
    expect(cloneTargetUrl("clone this", "https://example.com/page")).toBe("https://example.com/page");
    expect(cloneTargetUrl("clone https://northstar.example", "https://other.example")).toBe(
      "https://northstar.example",
    );
  });
});
