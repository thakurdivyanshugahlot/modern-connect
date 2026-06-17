// src/app/calendar/page.tsx
import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import {
  parseEvent,
  formatEventTime,
  getWeekRange,
  type ParsedEvent,
} from "@/server/lib/calendar-utils";
import Link from "next/link";
import { CreateEventButton } from "./CreateEventButton";

async function getWeekEvents(userId: string): Promise<ParsedEvent[]> {
  const tenant = corsair.withTenant(userId);
  const { timeMin, timeMax } = getWeekRange();

  const result = await tenant.googlecalendar.api.events.getMany({
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (result.items ?? []).map(parseEvent);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventCard({ event }: { event: ParsedEvent }) {
  const startTime = formatEventTime(event.start, event.isAllDay);
  const endTime = formatEventTime(event.end, event.isAllDay);
  const startDate = new Date(event.start);

  return (
    <div className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
      {/* Date column */}
      <div className="w-12 shrink-0 text-center">
        <div className="text-xs text-gray-400 uppercase">
          {startDate.toLocaleDateString("en-IN", { weekday: "short" })}
        </div>
        <div className="text-xl font-semibold text-gray-900">
          {startDate.getDate()}
        </div>
      </div>

      {/* Event details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {event.summary}
          </span>
          {event.hangoutLink && (
            <a
              href={event.hangoutLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline whitespace-nowrap shrink-0"
            >
              Join Meet
            </a>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {event.isAllDay ? "All day" : `${startTime} – ${endTime}`}
        </div>
        {event.location && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">
            📍 {event.location}
          </div>
        )}
        {event.attendees.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {event.attendees.slice(0, 3).map((a) => (
              <span
                key={a.email}
                className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
              >
                {a.name ?? a.email}
              </span>
            ))}
            {event.attendees.length > 3 && (
              <span className="text-xs text-gray-400">
                +{event.attendees.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CalendarPage() {
  const session = await requireSession();
  const events = await getWeekEvents(session.user.id);
  const grouped = groupByDate(events);

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/gmail/dashboard"
            className="text-sm text-blue-500 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">Calendar</h1>
          <p className="text-sm text-gray-400">Next 7 days</p>
        </div>
        <CreateEventButton userId={session.user.id} />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">No events this week</p>
          <p className="text-sm">Create one to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 divide-y divide-gray-50">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date} className="py-2">
              <div className="text-xs font-medium text-gray-400 uppercase mb-2">
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
