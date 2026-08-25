import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(saveSettings(body));
}
