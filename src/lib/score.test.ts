import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyPresence, isBookingUrl, isSocialUrl } from "./web";
import { keepForMode, scoreLead } from "./score";
import { isSkipBusiness } from "./chains";

describe("presence classification", () => {
  it("treats empty as none", () => {
    assert.equal(classifyPresence(""), "none");
    assert.equal(classifyPresence(undefined), "none");
  });

  it("spots social-only links", () => {
    assert.equal(isSocialUrl("https://instagram.com/cutsbymaya"), true);
    assert.equal(classifyPresence("https://linktr.ee/studio"), "social_only");
  });

  it("spots booking platforms", () => {
    assert.equal(isBookingUrl("https://www.fresha.com/book/salon"), true);
    assert.equal(classifyPresence("https://booksy.com/x"), "booking_only");
  });

  it("keeps real websites", () => {
    assert.equal(classifyPresence("https://maysbarbers.co.uk"), "real_website");
  });
});

describe("lead scoring", () => {
  it("ranks a true ghost highest", () => {
    const ghost = scoreLead({
      name: "Riverside Tyres",
      presence: "none",
      google: "not_found",
    });
    const listed = scoreLead({
      name: "Riverside Tyres",
      presence: "none",
      google: "listed_no_website",
    });
    assert.equal(ghost.kind, "ghost");
    assert.ok(ghost.score > listed.score);
  });

  it("flags instagram businesses without a website", () => {
    const lead = scoreLead({
      name: "Nails by Aisha",
      presence: "none",
      google: "unchecked",
      instagram: "nailsbyaisha",
    });
    assert.equal(lead.kind, "instagram");
    assert.ok(lead.reasons.some((reason) => /instagram/i.test(reason)));
  });

  it("keeps instagram mode tight", () => {
    assert.equal(
      keepForMode({ kind: "ghost", presence: "none", instagram: "", google: "not_found" }, "instagram"),
      false,
    );
    assert.equal(
      keepForMode({ kind: "instagram", presence: "social_only", instagram: "hello", google: "unchecked" }, "instagram"),
      true,
    );
  });
});

describe("chain filtering", () => {
  it("drops starbucks and embassies, keeps independents", () => {
    assert.equal(isSkipBusiness("Starbucks", { amenity: "cafe" }), true);
    assert.equal(isSkipBusiness("Embassy of France", { office: "diplomatic" }), true);
    assert.equal(isSkipBusiness("Riverside Tyres", { shop: "car_repair" }), false);
  });
});
