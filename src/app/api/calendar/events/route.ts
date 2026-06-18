// src/app/api/calendar/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { summary, date, startTime, endTime, location, description } = await req.json();

  const tenant = corsair.withTenant(session.user.id);

  const event = await tenant.googlecalendar.api.events.create({
    event: {
      summary,
      description,
      location,
      start: { dateTime: `${date}T${startTime}:00`, timeZone: "Asia/Kolkata" },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: "Asia/Kolkata" },
    },
    sendUpdates: "all",
  });

  return NextResponse.json(event);
}

export async function GET() {
  const session = await requireSession();
  const tenant = corsair.withTenant(session.user.id);

  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  const result = await tenant.googlecalendar.api.events.getMany({
    timeMin: now.toISOString(),
    timeMax: weekLater.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 20,
  });

  return NextResponse.json(result.items ?? []);
}