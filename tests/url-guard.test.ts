import { describe, expect, it } from "vitest";
import { extractUrl, generateUrl, scanUrl } from "@/lib/url-guard";

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

  it("makes a https url from a domain and a path from a name", () => {
    const domain = generateUrl("MyBakery.com");
    expect(domain.ok).toBe(true);
    if (domain.ok) expect(domain.url).toBe("https://mybakery.com/");

    const page = generateUrl("About us", "https://example.com");
    expect(page.ok).toBe(true);
    if (page.ok) expect(page.url).toBe("https://example.com/about-us");
  });

  it("pulls a url out of a sentence", () => {
    expect(extractUrl("can I open https://example.com/now please")).toBe("https://example.com/now");
  });
});
