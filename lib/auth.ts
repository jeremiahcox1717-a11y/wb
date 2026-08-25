import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE = "wb_studio";
const TTL_MS = 1000 * 60 * 60 * 24 * 30;

function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function sessionSecret() {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const password = adminPassword();
  if (!password) return "";
  return createHmac("sha256", "wb-studio").update(password).digest("hex");
}

export function isStudioConfigured() {
  return adminPassword().length >= 8;
}

export function passwordsMatch(input: string) {
  const expected = adminPassword();
  if (!expected || expected.length < 8) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(value: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Studio is not configured");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + TTL_MS, n: randomBytes(8).toString("hex") }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token || !sessionSecret()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookie(token: string) {
  const parts = [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(TTL_MS / 1000)}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  const parts = [`${COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function readSessionCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) : null;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export { COOKIE as SESSION_COOKIE };
