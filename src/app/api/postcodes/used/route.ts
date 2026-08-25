import { NextResponse } from "next/server";
import { forgetPostcode, getUsedPostcodes } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ used: getUsedPostcodes() });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as { postcode?: string };
  if (!body.postcode) return NextResponse.json({ error: "Missing postcode" }, { status: 400 });
  return NextResponse.json({ used: forgetPostcode(body.postcode) });
}
