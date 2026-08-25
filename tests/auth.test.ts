import { describe, expect, it, beforeEach } from "vitest";
import {
  createSessionToken,
  isSameOrigin,
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

  it("treats the Host header as same-origin even when request.url differs", () => {
    const request = new Request("http://0.0.0.0:3000/api/auth/login", {
      headers: {
        origin: "http://127.0.0.1:3000",
        host: "127.0.0.1:3000",
      },
    });
    expect(isSameOrigin(request)).toBe(true);
  });
});
