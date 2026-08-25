import { NextResponse } from "next/server";
import { nextUnusedPostcode } from "@/lib/postcodes";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { area?: string; country?: "uk" | "us" };
    const settings = getSettings();
    const record = await nextUnusedPostcode({
      area: body.area ?? settings.lockedArea,
      country: body.country ?? settings.defaultCountry,
    });
    return NextResponse.json({ postcode: record, usedCount: undefined, skipWholeOutcode: settings.skipWholeOutcode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate a postcode.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
