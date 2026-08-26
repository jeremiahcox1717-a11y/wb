import { describe, expect, it } from "vitest";
import { domainCandidates, formatDomainSearch, registrarLinks } from "@/lib/domain-shop";

describe("domain shop", () => {
  it("builds public .com candidates from a name", () => {
    const hosts = domainCandidates("Jordan Bennett");
    expect(hosts[0]).toBe("jordanbennett.com");
    expect(hosts).toContain("jordanbennett.net");
    expect(hosts).toContain("jordanbennett.org");
  });

  it("points buy links at real registrars", () => {
    const links = registrarLinks("jordanbennett.com");
    expect(links[0]?.name).toBe("GoDaddy");
    expect(links[0]?.href).toContain("godaddy.com");
    expect(links[0]?.href).toContain("jordanbennett.com");
    expect(links.some((item) => item.name === "Namecheap")).toBe(true);
    expect(links.some((item) => item.name === "Porkbun")).toBe(true);
  });

  it("tells the owner they must buy the domain at a registrar", () => {
    const summary = formatDomainSearch({
      query: "jordanbennett.com",
      hits: [
        {
          host: "jordanbennett.com",
          url: "https://jordanbennett.com",
          status: "available",
          registrars: registrarLinks("jordanbennett.com"),
        },
      ],
    });
    expect(summary).toMatch(/registrar/i);
    expect(summary).toMatch(/GoDaddy/i);
    expect(summary).toMatch(/jordanbennett\.com/);
    expect(summary).toMatch(/AVAILABLE/);
    expect(summary).toContain("godaddy.com");
  });
});
