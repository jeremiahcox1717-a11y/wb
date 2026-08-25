import { NextResponse } from "next/server";
import { lookupAny } from "@/lib/postcodes";
import { huntArea } from "@/lib/overpass";
import { enrichWithGoogle } from "@/lib/google";
import { getSettings } from "@/lib/store";
import type { HuntMode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      postcode?: string;
      mode?: HuntMode;
      radiusMeters?: number;
      googleKey?: string;
      country?: "uk" | "us";
    };
    if (!body.postcode?.trim()) {
      return NextResponse.json({ error: "Give me a postcode to hunt." }, { status: 400 });
    }
    const settings = getSettings();
    const lookup = await lookupAny(body.postcode, body.country ?? settings.defaultCountry);
    const mode: HuntMode = body.mode ?? "all";
    const radiusMeters = body.radiusMeters ?? settings.defaultRadius;
    const hunted = await huntArea({
      lat: lookup.lat,
      lon: lookup.lon,
      radiusMeters,
      mode,
      postcode: lookup.postcode,
    });
    const googleKey = body.googleKey?.trim() || process.env.GOOGLE_MAPS_API_KEY || "";
    if (googleKey) {
      await enrichWithGoogle(hunted.leads, googleKey, lookup);
    }
    return NextResponse.json({
      lookup,
      radiusMeters,
      mode,
      scanned: hunted.scanned,
      leads: hunted.leads,
      googleEnabled: Boolean(googleKey),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hunt failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
