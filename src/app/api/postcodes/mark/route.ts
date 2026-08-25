import { NextResponse } from "next/server";
import { lookupAny } from "@/lib/postcodes";
import { getSettings, rememberPostcode } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { postcode?: string; country?: "uk" | "us" };
    if (!body.postcode) return NextResponse.json({ error: "Missing postcode" }, { status: 400 });
    const settings = getSettings();
    const record = await lookupAny(body.postcode, body.country ?? settings.defaultCountry);
    rememberPostcode(record);
    return NextResponse.json({ postcode: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remember that postcode.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
