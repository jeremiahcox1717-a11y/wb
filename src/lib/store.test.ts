import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("used postcode memory", () => {
  it("never treats the same postcode as fresh", async () => {
    process.env.UNLISTED_DATA_DIR = mkdtempSync(join(tmpdir(), "unlisted-"));
    const { isPostcodeUsed, rememberPostcode, forgetPostcode, normalizePostcode } = await import("./store");
    const record = {
      postcode: "SW1A 1AA",
      outcode: "SW1A",
      country: "uk",
      lat: 51.5,
      lon: -0.14,
      issuedAt: new Date().toISOString(),
    };
    rememberPostcode(record);
    assert.equal(isPostcodeUsed("sw1a 1aa", "SW1A", false), true);
    assert.equal(isPostcodeUsed("SW1A 1AA", "SW1A", true), true);
    assert.equal(isPostcodeUsed("M1 1AE", "M1", false), false);
    rememberPostcode({ ...record, postcode: "SW1A 2AA", outcode: "SW1A" });
    assert.equal(isPostcodeUsed("SW1A 2BB", "SW1A", true), true);
    forgetPostcode("SW1A 1AA");
    assert.equal(normalizePostcode(" sw1a   1aa "), "SW1A 1AA");
  });
});
