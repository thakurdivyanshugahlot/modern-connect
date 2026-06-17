// src/server/lib/calendar-utils.ts

export interface ParsedEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  attendees: { email: string; name?: string; status?: string }[];
  htmlLink?: string;
  hangoutLink?: string;
}

export function parseEvent(raw: any): ParsedEvent {
  const isAllDay = !!raw.start?.date;
  return {
    id: raw.id ?? "",
    summary: raw.summary ?? "(No title)",
    description: raw.description,
    location: raw.location,
    start: raw.start?.dateTime ?? raw.start?.date ?? "",
    end: raw.end?.dateTime ?? raw.end?.date ?? "",
    isAllDay,
    attendees: (raw.attendees ?? []).map((a: any) => ({
      email: a.email ?? "",
      name: a.displayName,
      status: a.responseStatus,
    })),
    htmlLink: raw.htmlLink,
    hangoutLink: raw.hangoutLink,
  };
}

export function formatEventTime(dateStr: string, isAllDay: boolean): string {
  if (!dateStr) return "";
  if (isAllDay) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short", month: "short", day: "numeric",
    });
  }
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

export function getWeekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}