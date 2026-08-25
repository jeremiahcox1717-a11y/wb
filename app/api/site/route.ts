import { NextResponse } from "next/server";
import { readSite } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const site = await readSite();
  return NextResponse.json(site);
}
