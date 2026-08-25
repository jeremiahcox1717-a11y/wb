import { classifyPresence, instagramHandle } from "./web";
import { keepForMode, scoreLead } from "./score";
import { isSkipBusiness } from "./chains";
import type { BusinessLead, GoogleStatus, HuntMode } from "./types";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const UA = "Unlisted/1.0 (personal lead hunter)";

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lng?: number; lon?: number };
  tags?: Record<string, string>;
};

function tagWebsite(tags: Record<string, string>) {
  return tags.website || tags["contact:website"] || tags.url || "";
}

function tagPhone(tags: Record<string, string>) {
  return tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "";
}

function tagEmail(tags: Record<string, string>) {
  return tags.email || tags["contact:email"] || "";
}

function tagFacebook(tags: Record<string, string>) {
  return tags["contact:facebook"] || tags.facebook || "";
}

function tagInstagram(tags: Record<string, string>) {
  const direct = tags["contact:instagram"] || tags.instagram || "";
  if (direct) return direct;
  const site = tagWebsite(tags);
  if (/instagram\.com/i.test(site)) return site;
  return "";
}

function categoryOf(tags: Record<string, string>) {
  return (
    tags.shop ||
    tags.craft ||
    tags.office ||
    tags.amenity ||
    tags.tourism ||
    tags.leisure ||
    tags.healthcare ||
    "local business"
  ).replace(/_/g, " ");
}

function addressOf(tags: Record<string, string>) {
  const line = [
    tags["addr:housenumber"],
    tags["addr:street"],
  ]
    .filter(Boolean)
    .join(" ");
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:suburb"] || "";
  return [line, city].filter(Boolean).join(", ") || undefined;
}

function buildQuery(lat: number, lon: number, radius: number) {
  return `
[out:json][timeout:45];
(
  nwr["shop"](around:${radius},${lat},${lon});
  nwr["craft"](around:${radius},${lat},${lon});
  nwr["office"](around:${radius},${lat},${lon});
  nwr["amenity"~"restaurant|cafe|fast_food|pub|bar|pharmacy|dentist|doctors|clinic|veterinary|car_repair|car_wash|fuel|bank"](around:${radius},${lat},${lon});
  nwr["tourism"~"hotel|guest_house|hostel|attraction"](around:${radius},${lat},${lon});
  nwr["leisure"~"fitness_centre|sports_centre|spa|pitch"](around:${radius},${lat},${lon});
  nwr["healthcare"](around:${radius},${lat},${lon});
  nwr["contact:instagram"](around:${radius},${lat},${lon});
  nwr["instagram"](around:${radius},${lat},${lon});
);
out center tags;
`.trim();
}

async function overpass(query: string): Promise<OsmElement[]> {
  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: new URLSearchParams({ data: query }),
      });
      if (!res.ok) {
        lastError = new Error(`Map lookup failed (${res.status})`);
        continue;
      }
      const json = (await res.json()) as { elements?: OsmElement[] };
      return json.elements ?? [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Map lookup failed");
    }
  }
  throw lastError ?? new Error("Map lookup failed");
}

function toLead(el: OsmElement): BusinessLead | null {
  const tags = el.tags ?? {};
  const name = tags.name || tags.brand;
  if (!name) return null;
  if (isSkipBusiness(name, tags)) return null;
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon ?? el.center?.lng;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const website = tagWebsite(tags) || undefined;
  const instagram = instagramHandle(tagInstagram(tags)) || undefined;
  const presence = classifyPresence(website);
  const google: GoogleStatus = "unchecked";
  const scored = scoreLead({
    name,
    presence,
    google,
    phone: tagPhone(tags) || undefined,
    email: tagEmail(tags) || undefined,
    instagram,
    facebook: tagFacebook(tags) || undefined,
    category: categoryOf(tags),
  });

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    lat,
    lon,
    category: categoryOf(tags),
    address: addressOf(tags),
    postcode: tags["addr:postcode"],
    phone: tagPhone(tags) || undefined,
    email: tagEmail(tags) || undefined,
    website,
    facebook: tagFacebook(tags) || undefined,
    instagram,
    presence,
    google,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${tags["addr:postcode"] || `${lat},${lon}`}`)}`,
    kind: scored.kind,
    score: scored.score,
    reasons: scored.reasons,
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

export async function huntArea(opts: {
  lat: number;
  lon: number;
  radiusMeters: number;
  mode: HuntMode;
  postcode?: string;
}): Promise<{ scanned: number; qualified: number; leads: BusinessLead[] }> {
  const elements = await overpass(buildQuery(opts.lat, opts.lon, opts.radiusMeters));
  const seen = new Set<string>();
  const leads: BusinessLead[] = [];
  for (const el of elements) {
    const lead = toLead(el);
    if (!lead) continue;
    const key = `${lead.name.toLowerCase()}|${lead.lat.toFixed(4)}|${lead.lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (opts.postcode && !lead.postcode) lead.postcode = opts.postcode;
    if (!keepForMode(lead, opts.mode)) continue;
    leads.push(lead);
  }
  leads.sort((a, b) => b.score - a.score);
  return { scanned: elements.length, qualified: leads.length, leads: leads.slice(0, 48) };
}
