import { NextResponse } from "next/server";
import { isOwnerRequest } from "@/lib/owner-gate";
import { readSite } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isOwnerRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const site = await readSite();
  return NextResponse.json(site);
}
