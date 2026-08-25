import { classifyPresence } from "./web";
import { scoreLead } from "./score";
import type { BusinessLead, GoogleStatus } from "./types";

type PlaceTextSearch = {
  status: string;
  results?: {
    place_id: string;
    name: string;
    formatted_address?: string;
    geometry?: { location: { lat: number; lng: number } };
  }[];
  error_message?: string;
};

type PlaceDetails = {
  status: string;
  result?: {
    website?: string;
    url?: string;
    formatted_phone_number?: string;
    name?: string;
  };
};

function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function textSearch(query: string, key: string, lat: number, lon: number) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("location", `${lat},${lon}`);
  url.searchParams.set("radius", "400");
  url.searchParams.set("key", key);
  const res = await fetch(url);
  return (await res.json()) as PlaceTextSearch;
}

async function details(placeId: string, key: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,website,url,formatted_phone_number");
  url.searchParams.set("key", key);
  const res = await fetch(url);
  return (await res.json()) as PlaceDetails;
}

export async function enrichWithGoogle(leads: BusinessLead[], key: string, origin: { lat: number; lon: number }) {
  const limited = leads.slice(0, 12);
  for (const lead of limited) {
    try {
      const search = await textSearch(`${lead.name} ${lead.postcode ?? ""}`.trim(), key, origin.lat, origin.lon);
      if (search.status === "ZERO_RESULTS" || !search.results?.length) {
        lead.google = "not_found";
      } else {
        const best = search.results.find((row) => {
          const loc = row.geometry?.location;
          if (!loc) return true;
          return distanceMeters(lead, { lat: loc.lat, lon: loc.lng }) < 250;
        }) ?? search.results[0];
        const loc = best.geometry?.location;
        if (loc && distanceMeters(lead, { lat: loc.lat, lon: loc.lng }) > 350) {
          lead.google = "not_found";
        } else {
          const info = await details(best.place_id, key);
          const website = info.result?.website;
          lead.googlePlaceId = best.place_id;
          lead.googleMapsUrl = info.result?.url || lead.googleMapsUrl;
          const status: GoogleStatus = website ? "listed_with_website" : "listed_no_website";
          lead.google = status;
          if (!lead.website && website) lead.website = website;
          if (!lead.phone && info.result?.formatted_phone_number) {
            lead.phone = info.result.formatted_phone_number;
          }
          if (website && lead.presence === "none") {
            lead.presence = classifyPresence(website);
          }
        }
      }
    } catch {
      lead.google = "unchecked";
    }
    const scored = scoreLead({
      name: lead.name,
      presence: lead.presence,
      google: lead.google,
      phone: lead.phone,
      email: lead.email,
      instagram: lead.instagram,
      facebook: lead.facebook,
    });
    lead.score = scored.score;
    lead.kind = scored.kind;
    lead.reasons = scored.reasons;
  }
  leads.sort((a, b) => b.score - a.score);
  return leads;
}
