import { NextResponse } from "next/server";
import { deleteLead, getLeads, saveLead, updateLead } from "@/lib/store";
import type { SavedLead } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ leads: getLeads() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<SavedLead>;
  if (!body.name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  const lead: SavedLead = {
    id: body.id || `lead-${Date.now()}`,
    name: body.name,
    kind: body.kind || "ghost",
    category: body.category || "business",
    address: body.address,
    postcode: body.postcode,
    phone: body.phone,
    instagram: body.instagram,
    website: body.website,
    notes: body.notes || "",
    status: body.status || "new",
    savedAt: body.savedAt || new Date().toISOString(),
  };
  return NextResponse.json({ leads: saveLead(lead) });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as { id?: string } & Partial<SavedLead>;
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { id, ...patch } = body;
  return NextResponse.json({ leads: updateLead(id, patch) });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return NextResponse.json({ leads: deleteLead(body.id) });
}
