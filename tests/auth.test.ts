import { describe, expect, it, beforeEach } from "vitest";
import {
  createSessionToken,
  isStudioConfigured,
  passwordsMatch,
  verifySessionToken,
} from "@/lib/auth";

describe("studio auth", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    process.env.SESSION_SECRET = "unit-test-session-secret";
  });

  it("requires an 8+ character admin password", () => {
    process.env.ADMIN_PASSWORD = "short";
    expect(isStudioConfigured()).toBe(false);
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    expect(isStudioConfigured()).toBe(true);
  });

  it("accepts only the owner password", () => {
    expect(passwordsMatch("correct-horse-battery")).toBe(true);
    expect(passwordsMatch("wrong-password-long")).toBe(false);
  });

  it("round-trips a signed session and rejects a forged one", () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
    expect(verifySessionToken(`${token}x`)).toBe(false);
    expect(verifySessionToken("")).toBe(false);
  });
});
