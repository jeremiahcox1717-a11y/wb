import { describe, expect, it } from "vitest";
import { CURRENCY_CODES, formatConversion, looksLikeMoney, parseMoney, resolveCurrency } from "@/lib/currency";
import { defaultSite } from "@/lib/default-site";
import { scanNameLocal } from "@/lib/name-guard";
import { entryIsEmpty, normalizeEntry } from "@/lib/notebook";

describe("currency parser", () => {
  it("reads 100 CAD as Canadian dollars", () => {
    expect(parseMoney("100 CAD")).toEqual({ amount: 100, from: "CAD" });
    expect(parseMoney("100 cad")).toEqual({ amount: 100, from: "CAD" });
  });

  it("reads pounds and euros", () => {
    expect(parseMoney("50 pounds")).toEqual({ amount: 50, from: "GBP" });
    expect(parseMoney("20 euros")).toEqual({ amount: 20, from: "EUR" });
  });

  it("reads a from and to pair", () => {
    expect(parseMoney("100 CAD to EUR")).toEqual({ amount: 100, from: "CAD", to: "EUR" });
    expect(parseMoney("50 pounds to CAD")).toEqual({ amount: 50, from: "GBP", to: "CAD" });
    expect(parseMoney("20 euros in yen")).toEqual({ amount: 20, from: "EUR", to: "JPY" });
  });

  it("covers every Frankfurter currency", () => {
    expect(CURRENCY_CODES).toContain("CNY");
    expect(CURRENCY_CODES).toContain("ZAR");
    expect(CURRENCY_CODES).toContain("KRW");
    expect(CURRENCY_CODES).toHaveLength(30);
  });

  it("treats a bare number as CAD", () => {
    expect(parseMoney("100")).toEqual({ amount: 100, from: "CAD" });
  });

  it("formats a pair and the rest of the currencies", () => {
    const summary = formatConversion({ amount: 100, from: "CAD", to: "EUR" }, { EUR: 65, GBP: 55, USD: 73, JPY: 11000 });
    expect(summary).toMatch(/65/);
    expect(summary).toMatch(/JPY/);
    expect(summary).toMatch(/Every other currency/);
  });

  it("detects money questions", () => {
    expect(looksLikeMoney("100 CAD")).toBe(true);
    expect(looksLikeMoney("build me a bakery")).toBe(false);
  });

  it("reads typed currency names on both sides", () => {
    expect(resolveCurrency("euros")).toBe("EUR");
    expect(resolveCurrency("pounds")).toBe("GBP");
    expect(resolveCurrency("yen")).toBe("JPY");
    expect(resolveCurrency("Canadian Dollar")).toBe("CAD");
  });
});

describe("name scanner", () => {
  it("says no when the name is the site owner", () => {
    const result = scanNameLocal("Jordan Bennett", "Jordan Bennett");
    expect(result.answer).toBe("no");
    expect(result.reasons.join(" ")).toMatch(/owner/i);
  });
});

describe("notebook", () => {
  it("needs at least one field to save", () => {
    expect(entryIsEmpty(normalizeEntry({}))).toBe(true);
    expect(entryIsEmpty(normalizeEntry({ name: "Ada", businessName: "Bakery" }))).toBe(false);
  });
});

describe("default site tools", () => {
  it("includes url, name, currency, and notebook sections", () => {
    const types = defaultSite().pages[0]?.sections.map((section) => section.type) ?? [];
    expect(types).toContain("urlMaker");
    expect(types).toContain("urlScanner");
    expect(types).toContain("nameScanner");
    expect(types).toContain("currencyCalculator");
    expect(types).toContain("notebook");
  });

  it("starts in black and white", () => {
    expect(defaultSite().theme.background).toBe("#0b0b0c");
    expect(defaultSite().theme.accent).toBe("#f2f2f0");
  });
});
