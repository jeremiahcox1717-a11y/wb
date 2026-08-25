const BOOKING_HOSTS = [
  "treatwell",
  "fresha.com",
  "booksy.com",
  "calendly.com",
  "acuityscheduling.com",
  "simplybook",
  "setmore.com",
  "styleseat.com",
  "vagaro.com",
  "mindbodyonline.com",
  "glossgenius.com",
  "boulevard.io",
  "phorest.com",
  "salonized.com",
  "booking.com",
  "opentable.com",
  "resy.com",
  "square.site",
  "squareup.com",
  "book.squareup",
  "thefork.com",
  "quandoo",
  "appointy.com",
  "schedulicity.com",
  "janeapp.com",
  "cliniko.com",
  "timelyapp.com",
];

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "m.facebook.com",
  "tiktok.com",
  "linktr.ee",
  "linkin.bio",
  "bio.site",
  "beacons.ai",
  "twitter.com",
  "x.com",
  "youtube.com",
  "wa.me",
  "api.whatsapp.com",
];

export function hostOf(url?: string | null) {
  if (!url) return "";
  try {
    const withProto = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withProto).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function isBookingUrl(url?: string | null) {
  const host = hostOf(url);
  return BOOKING_HOSTS.some((part) => host.includes(part));
}

export function isSocialUrl(url?: string | null) {
  const host = hostOf(url);
  return SOCIAL_HOSTS.some((part) => host.includes(part));
}

export function classifyPresence(website?: string | null): "none" | "social_only" | "booking_only" | "real_website" {
  if (!website || !website.trim()) return "none";
  if (isSocialUrl(website)) return "social_only";
  if (isBookingUrl(website)) return "booking_only";
  return "real_website";
}

export function instagramHandle(raw?: string | null) {
  if (!raw) return "";
  const value = raw.trim();
  const match = value.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (match) return match[1];
  return value.replace(/^@/, "");
}
