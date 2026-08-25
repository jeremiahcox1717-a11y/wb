import { classifyPresence, instagramHandle } from "./web";
import type { BusinessLead, GoogleStatus, LeadKind, Presence } from "./types";

export function scoreLead(input: {
  name: string;
  presence: Presence;
  google: GoogleStatus;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
}): { score: number; kind: LeadKind; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const ig = instagramHandle(input.instagram);

  if (input.presence === "none") {
    score += 42;
    reasons.push("No website at all");
  } else if (input.presence === "social_only") {
    score += 34;
    reasons.push("Only a social link, no real website");
  } else if (input.presence === "booking_only") {
    score += 28;
    reasons.push("Only a booking page, no own website");
  }

  if (input.google === "not_found") {
    score += 40;
    reasons.push("No Google Business Profile found");
  } else if (input.google === "listed_no_website") {
    score += 24;
    reasons.push("On Google, but the listing has no website");
  } else if (input.google === "unchecked") {
    score += 8;
    reasons.push("Google listing not checked yet — worth verifying");
  }

  if (ig && input.presence !== "real_website") {
    score += 22;
    reasons.push("Instagram business with no proper website");
  }

  if (!input.phone) {
    score += 4;
    reasons.push("No phone listed");
  }
  if (!input.email) {
    score += 3;
  }
  if (!input.facebook && !ig) {
    score += 2;
  }

  let kind: LeadKind = "thin";
  if (input.google === "not_found" && input.presence !== "real_website") kind = "ghost";
  else if (input.google === "listed_no_website" && input.presence !== "real_website") kind = "unclaimed";
  else if (ig && input.presence !== "real_website") kind = "instagram";
  else if (input.presence !== "real_website") kind = "ghost";

  return { score, kind, reasons };
}

export function keepForMode(lead: Pick<BusinessLead, "kind" | "presence" | "instagram" | "google">, mode: "ghosts" | "instagram" | "all") {
  if (mode === "all") return lead.presence !== "real_website" || lead.google === "not_found" || lead.google === "listed_no_website";
  if (mode === "instagram") {
    return Boolean(instagramHandle(lead.instagram)) && lead.presence !== "real_website";
  }
  return lead.presence !== "real_website";
}

export { classifyPresence };
