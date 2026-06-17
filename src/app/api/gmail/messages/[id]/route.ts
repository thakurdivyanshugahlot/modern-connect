// src/app/api/gmail/messages/[id]/route.ts
import { NextResponse } from "next/server";
import { corsair } from "@/server/lib/corsair";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tenant = corsair.withTenant(session.user.id);

  const message = await tenant.gmail.api.messages.get({
    id,
    format: "full", // "full" | "metadata" | "minimal" | "raw"
  });

  return NextResponse.json(message);
}