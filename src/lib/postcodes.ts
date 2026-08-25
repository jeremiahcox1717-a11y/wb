import { rememberPostcode, isPostcodeUsed, getSettings, normalizePostcode } from "./store";
import type { PostcodeRecord, Settings } from "./types";

const UA = "Unlisted/1.0 (personal lead hunter; contact: local)";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  return (await res.json()) as T;
}

type PostcodesIoLookup = {
  status: number;
  result: {
    postcode: string;
    outcode: string;
    country: string;
    region?: string;
    admin_district?: string;
    latitude: number;
    longitude: number;
    parliamentary_constituency?: string;
  } | null;
};

type PostcodesIoRandom = PostcodesIoLookup;

type PostcodesIoOutcode = {
  status: number;
  result: {
    outcode: string;
    country: string[];
    admin_district?: string[];
    latitude: number;
    longitude: number;
  };
};

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: { postcode?: string; country_code?: string };
};

export async function lookupUkPostcode(postcode: string): Promise<PostcodeRecord> {
  const encoded = encodeURIComponent(normalizePostcode(postcode));
  const data = await fetchJson<PostcodesIoLookup>(`https://api.postcodes.io/postcodes/${encoded}`);
  if (!data.result) throw new Error("That postcode was not found.");
  return {
    postcode: data.result.postcode,
    outcode: data.result.outcode,
    country: "uk",
    region: data.result.region,
    district: data.result.admin_district,
    area: data.result.parliamentary_constituency,
    lat: data.result.latitude,
    lon: data.result.longitude,
    issuedAt: new Date().toISOString(),
  };
}

async function randomUkPostcode(outcode?: string): Promise<PostcodeRecord> {
  const url = outcode
    ? `https://api.postcodes.io/random/postcodes?outcode=${encodeURIComponent(outcode)}`
    : "https://api.postcodes.io/random/postcodes";
  const data = await fetchJson<PostcodesIoRandom>(url);
  if (!data.result) throw new Error("Could not generate a postcode.");
  return {
    postcode: data.result.postcode,
    outcode: data.result.outcode,
    country: "uk",
    region: data.result.region,
    district: data.result.admin_district,
    area: data.result.parliamentary_constituency,
    lat: data.result.latitude,
    lon: data.result.longitude,
    issuedAt: new Date().toISOString(),
  };
}

async function outcodesNear(lat: number, lon: number): Promise<string[]> {
  const data = await fetchJson<{ status: number; result: { outcode: string }[] }>(
    `https://api.postcodes.io/outcodes?lon=${lon}&lat=${lat}&limit=20`,
  );
  return (data.result ?? []).map((row) => row.outcode);
}

async function lookupOutcode(outcode: string): Promise<PostcodeRecord> {
  const data = await fetchJson<PostcodesIoOutcode>(
    `https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`,
  );
  if (!data.result) throw new Error("That area code was not found.");
  const sample = await randomUkPostcode(data.result.outcode).catch(() => null);
  if (sample) return sample;
  return {
    postcode: data.result.outcode,
    outcode: data.result.outcode,
    country: "uk",
    district: data.result.admin_district?.[0],
    lat: data.result.latitude,
    lon: data.result.longitude,
    issuedAt: new Date().toISOString(),
  };
}

async function nominatimSearch(query: string): Promise<PostcodeRecord> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
  const hits = await fetchJson<NominatimHit[]>(url);
  const hit = hits[0];
  if (!hit) throw new Error("Could not find that area.");
  const postcode = hit.address?.postcode || query.toUpperCase();
  const parts = postcode.split(" ");
  return {
    postcode,
    outcode: parts[0] || postcode,
    country: hit.address?.country_code === "us" ? "us" : "uk",
    area: hit.display_name,
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    issuedAt: new Date().toISOString(),
  };
}

async function lookupUsZip(zip: string): Promise<PostcodeRecord> {
  const data = await fetchJson<{
    "post code"?: string;
    places?: { latitude: string; longitude: string; "place name": string; state: string }[];
  }>(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  const place = data.places?.[0];
  if (!place) throw new Error("That ZIP code was not found.");
  return {
    postcode: data["post code"] || zip,
    outcode: (data["post code"] || zip).slice(0, 3),
    country: "us",
    district: place.state,
    area: place["place name"],
    lat: Number(place.latitude),
    lon: Number(place.longitude),
    issuedAt: new Date().toISOString(),
  };
}

export async function lookupAny(input: string, country: "uk" | "us"): Promise<PostcodeRecord> {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a postcode first.");
  if (country === "us" || /^\d{5}(-\d{4})?$/.test(trimmed)) {
    return lookupUsZip(trimmed.slice(0, 5));
  }
  if (/^[A-Z]{1,2}\d/i.test(trimmed) && trimmed.replace(/\s/g, "").length <= 4) {
    return lookupOutcode(trimmed.toUpperCase());
  }
  try {
    return await lookupUkPostcode(trimmed);
  } catch {
    return nominatimSearch(trimmed);
  }
}

function looksLikeUkPostcode(value: string) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim());
}

async function resolveArea(area: string, country: "uk" | "us"): Promise<{ lat: number; lon: number; outcodes: string[] }> {
  const trimmed = area.trim();
  if (!trimmed) return { lat: 0, lon: 0, outcodes: [] };
  if (country === "uk" && /^[A-Z]{1,2}\d/i.test(trimmed) && trimmed.length <= 4) {
    const record = await lookupOutcode(trimmed.toUpperCase());
    const nearby = await outcodesNear(record.lat, record.lon);
    return { lat: record.lat, lon: record.lon, outcodes: [record.outcode, ...nearby] };
  }
  if (country === "uk") {
    const places = await fetchJson<{ status: number; result: { latitude: number; longitude: number; name_1: string }[] | null }>(
      `https://api.postcodes.io/places?q=${encodeURIComponent(trimmed)}&limit=1`,
    );
    const place = places.result?.[0];
    if (place) {
      const nearby = await outcodesNear(place.latitude, place.longitude);
      return { lat: place.latitude, lon: place.longitude, outcodes: nearby };
    }
  }
  const geo = await nominatimSearch(trimmed);
  const nearby = country === "uk" ? await outcodesNear(geo.lat, geo.lon) : [];
  return { lat: geo.lat, lon: geo.lon, outcodes: nearby.length ? nearby : [geo.outcode] };
}

export async function nextUnusedPostcode(opts?: { area?: string; country?: "uk" | "us" }): Promise<PostcodeRecord> {
  const settings: Settings = getSettings();
  const country = opts?.country ?? settings.defaultCountry;
  const area = (opts?.area ?? settings.lockedArea).trim();
  const skipWhole = settings.skipWholeOutcode;

  const tryAccept = (record: PostcodeRecord) => {
    if (isPostcodeUsed(record.postcode, record.outcode, skipWhole)) return null;
    rememberPostcode(record);
    return record;
  };

  if (country === "us") {
    if (area && /^\d{5}/.test(area)) {
      const record = await lookupUsZip(area);
      const accepted = tryAccept(record);
      if (accepted) return accepted;
      throw new Error("That ZIP has already been used. Unlock it from history or pick another.");
    }
    const seed = area || "10001";
    const geo = /^\d{5}/.test(seed) ? await lookupUsZip(seed) : await nominatimSearch(`${seed}, USA`);
    for (let i = 0; i < 40; i += 1) {
      const zip = String(Math.max(10001, Math.min(99950, Math.round(Number(geo.postcode || "10001") + i * 17 + Math.floor(Math.random() * 30))))).padStart(5, "0");
      try {
        const record = await lookupUsZip(zip);
        const accepted = tryAccept(record);
        if (accepted) return accepted;
      } catch {
        continue;
      }
    }
    throw new Error("Ran out of unused ZIP codes nearby. Try a different city.");
  }

  if (area) {
    if (looksLikeUkPostcode(area)) {
      const record = await lookupUkPostcode(area);
      const accepted = tryAccept(record);
      if (accepted) return accepted;
      throw new Error("That postcode has already been used.");
    }
    const resolved = await resolveArea(area, "uk");
    const unique = Array.from(new Set(resolved.outcodes));
    for (const outcode of unique) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const record = await randomUkPostcode(outcode);
          const accepted = tryAccept(record);
          if (accepted) return accepted;
        } catch {
          continue;
        }
      }
    }
    throw new Error("Every nearby postcode in that area has already been used. Try a wider city.");
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const record = await randomUkPostcode();
    const accepted = tryAccept(record);
    if (accepted) return record;
  }
  throw new Error("Could not find an unused postcode. Clear a few from history and try again.");
}
