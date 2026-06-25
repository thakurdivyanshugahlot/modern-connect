import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import {
  parseEvent,
  getWeekRange,
  type ParsedEvent,
} from "@/server/lib/calendar-utils";
import CalendarClient from "@/components/client/CalendarClient";



async function getWeekEvents(userId: string): Promise<ParsedEvent[]> {
  const tenant = corsair.withTenant(userId);
  const { timeMin, timeMax } = getWeekRange();

  try {
    const result = await tenant.googlecalendar.api.events.getMany({
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });
    return (result.items ?? []).map(parseEvent);
  } catch (err) {
    console.error("Calendar fetch error:", err);
    return [];
  }
}

function groupByDate(events: ParsedEvent[]): Record<string, ParsedEvent[]> {
  return events.reduce(
    (acc, event) => {
      const date = event.start.split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    },
    {} as Record<string, ParsedEvent[]>,
  );
}

export default async function CalendarPage() {
  const session = await requireSession();
  const events = await getWeekEvents(session.user.id);
  const grouped = groupByDate(events);

  return (
    <CalendarClient
      userId={session.user.id}
      groupedEvents={grouped}
      totalCount={events.length}
    />
  );
}