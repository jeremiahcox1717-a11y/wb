import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { customizeSite } from "@/lib/ai/customize";
import { shouldCreateNewProject, shouldEditClientProject, wantsNewClientSite } from "@/lib/ai/builder-intent";
import { blankClientSite, extractClientLabel, stripOwnerTools } from "@/lib/client-site";
import { defaultSite } from "@/lib/default-site";
import { createProject, listProjects, readProject, slugifyName } from "@/lib/projects";
import { parseSite } from "@/lib/schema";

describe("builder intent", () => {
  it("treats clone and from-scratch as new client sites", () => {
    expect(wantsNewClientSite("clone https://example.com")).toBe(true);
    expect(wantsNewClientSite("Build a white and blue site")).toBe(true);
    expect(wantsNewClientSite("make a website for other people")).toBe(true);
    expect(wantsNewClientSite("what's the time?")).toBe(false);
  });

  it("creates a new project when there is no active site yet", () => {
    expect(shouldCreateNewProject("make the heading Hello", false)).toBe(true);
    expect(shouldCreateNewProject("make the heading Hello", true)).toBe(false);
    expect(shouldEditClientProject("make the heading Hello", true)).toBe(true);
    expect(shouldCreateNewProject("change the website back to jordan bennett", true)).toBe(false);
  });
});

describe("blank client site", () => {
  it("is not the Jordan Bennett homepage and has no owner tools", () => {
    const site = blankClientSite();
    expect(site.identity.siteName).not.toBe("Jordan Bennett");
    const types = site.pages[0]?.sections.map((section) => section.type) ?? [];
    expect(types).not.toContain("urlMaker");
    expect(types).not.toContain("notebook");
    expect(extractClientLabel("build a bakery called Hearth & Crumb")).toBe("Hearth & Crumb");
  });

  it("strips owner tools even if they were injected", () => {
    const site = stripOwnerTools(defaultSite());
    const types = site.pages[0]?.sections.map((section) => section.type) ?? [];
    expect(types).not.toContain("currencyCalculator");
    expect(site.identity.siteName).toBe("Jordan Bennett");
  });
});

describe("client projects", () => {
  let dir = "";

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "wb-projects-"));
    process.env.WB_DATA_DIR = dir;
  });

  afterEach(async () => {
    delete process.env.WB_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it("saves a new site without writing the owner homepage", async () => {
    const homePath = path.join(dir, "site.json");
    const home = defaultSite();
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
    await writeFile(homePath, `${JSON.stringify(home, null, 2)}\n`);

    const project = await createProject({
      site: blankClientSite(),
      source: "scratch",
      message: "build a bakery called Hearth & Crumb",
    });
    expect(project.slug).toBe(slugifyName("Hearth & Crumb"));
    expect(project.name).toBe("Hearth & Crumb");
    const savedHome = parseSite(JSON.parse(await readFile(homePath, "utf8")));
    expect(savedHome.identity.siteName).toBe("Jordan Bennett");
    const loaded = await readProject(project.slug);
    expect(loaded?.site.identity.siteName).toBe("Hearth & Crumb");
  });

  it("builds a white and blue site as a new project and leaves Jordan Bennett alone", async () => {
    const home = defaultSite();
    const result = await customizeSite({
      homeSite: home,
      activeProject: null,
      message: "Build a website and make it white and blue",
      settings: {},
    });
    expect(result.homeChanged).toBe(false);
    expect(result.homeSite.identity.siteName).toBe("Jordan Bennett");
    expect(result.project?.slug).toBeTruthy();
    expect(result.project?.site.theme.background.toLowerCase()).toBe("#f7f7f4");
    expect(result.project?.site.theme.accent.toLowerCase()).toBe("#1d4e89");
    const types = result.project?.site.pages[0]?.sections.map((section) => section.type) ?? [];
    expect(types).not.toContain("notebook");
    expect((await listProjects()).length).toBe(1);
  });

  it("clones into a new project instead of the owner homepage", async () => {
    const home = defaultSite();
    const html = `<!doctype html><html><head><title>North Star Labs</title></head><body><h1>North Star Labs</h1><p>We build quiet tools for private work and keep the rest of the page simple enough to clone.</p></body></html>`;
    const { siteFromHtml } = await import("@/lib/ai/clone-site");
    const cloned = siteFromHtml(blankClientSite(), html, "https://northstar.example/work");
    const project = await createProject({ site: cloned, source: "clone", message: "clone https://northstar.example/work" });
    expect(home.identity.siteName).toBe("Jordan Bennett");
    expect(project.site.identity.siteName).toBe("North Star Labs");
    expect(project.site.identity.ownerName).not.toBe("Jordan Bennett");
  });
});
