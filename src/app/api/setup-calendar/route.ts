// src/app/api/setup-calendar/route.ts — run once then delete
import { corsair } from "@/server/lib/corsair";
import { NextResponse } from "next/server";

export async function GET() {
    // Remove this route or restrict it after initial setup
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  await corsair.keys.googlecalendar.set_client_id(process.env.GMAIL_CLIENT_ID!);
  await corsair.keys.googlecalendar.set_client_secret(process.env.GMAIL_CLIENT_SECRET!);
  return NextResponse.json({ ok: true });
}

