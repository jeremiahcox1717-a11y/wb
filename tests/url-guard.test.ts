import { describe, expect, it } from "vitest";
import { extractUrl, generateUrl, looksLikeCloneRequest, looksLikeUrlMake, looksLikeUrlQuestion, scanUrl } from "@/lib/url-guard";

describe("url guard", () => {
  it("says yes for a normal https address", () => {
    const result = scanUrl("https://example.com");
    expect(result.answer).toBe("yes");
    expect(result.url).toContain("example.com");
  });

  it("says no for javascript and data links", () => {
    expect(scanUrl("javascript:alert(1)").answer).toBe("no");
    expect(scanUrl("data:text/html,hi").answer).toBe("no");
  });

  it("says no for http, local, and password-in-url tricks", () => {
    expect(scanUrl("http://example.com").answer).toBe("no");
    expect(scanUrl("https://127.0.0.1/login").answer).toBe("no");
    expect(scanUrl("https://user:pass@example.com").answer).toBe("no");
  });

  it("says no for fake brand links", () => {
    expect(scanUrl("https://paypal-secure-login.example.biz/verify").answer).toBe("no");
  });

  it("makes a .com address from a name", () => {
    const domain = generateUrl("MyBakery.com");
    expect(domain.ok).toBe(true);
    if (domain.ok) expect(domain.url).toBe("https://mybakery.com");

    const fromName = generateUrl("Jordan Bennett");
    expect(fromName.ok).toBe(true);
    if (fromName.ok) expect(fromName.url).toBe("https://jordanbennett.com");

    const fromSentence = generateUrl("make a url for Hearth & Crumb at .com");
    expect(fromSentence.ok).toBe(true);
    if (fromSentence.ok) expect(fromSentence.url).toBe("https://hearthandcrumb.com");
  });

  it("detects domain-shop requests without treating a scan as a make", () => {
    expect(looksLikeUrlMake("make a url for Jordan Bennett")).toBe(true);
    expect(looksLikeUrlMake("I need an official url for Jordan")).toBe(true);
    expect(looksLikeUrlMake("register a domain for Hearth")).toBe(true);
    expect(looksLikeUrlMake("scan this url https://example.com")).toBe(false);
    expect(looksLikeUrlMake("build me a bakery")).toBe(false);
    expect(looksLikeUrlMake("make my website a bakery")).toBe(false);
    expect(looksLikeUrlMake("clone https://example.com")).toBe(false);
  });

  it("treats a pasted link as a clone, not a scan, unless asked to check it", () => {
    expect(looksLikeCloneRequest("https://example.com")).toBe(true);
    expect(looksLikeCloneRequest("clone https://example.com")).toBe(true);
    expect(looksLikeCloneRequest("copy this site")).toBe(true);
    expect(looksLikeCloneRequest("clone this")).toBe(true);
    expect(looksLikeCloneRequest("build a website and make it white and blue")).toBe(false);
    expect(looksLikeCloneRequest("scan https://example.com")).toBe(false);
    expect(looksLikeCloneRequest("is https://example.com safe")).toBe(false);
    expect(looksLikeUrlQuestion("scan https://example.com")).toBe(true);
    expect(looksLikeUrlQuestion("https://example.com")).toBe(false);
  });

  it("pulls a url out of a sentence", () => {
    expect(extractUrl("can I open https://example.com/now please")).toBe("https://example.com/now");
  });
});
