import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import { getTodayRange, parseEvent } from "@/server/lib/calendar-utils";
import DashboardClient from "./DashboardClient";

async function getDashboardData(userId: string) {
  const tenant = corsair.withTenant(userId);

  // Single DB read — no Gmail API calls
  const cached = await tenant.gmail.db.messages.list({});
  
  const uniqueMessagesMap = new Map<string, any>();
  for (const row of (cached ?? [])) {
    const msg = row.data;
    if (msg?.id) {
      uniqueMessagesMap.set(msg.id, msg);
    }
  }
  const allMessages = Array.from(uniqueMessagesMap.values());

  const today = new Date().toDateString();

  const unreadCount = allMessages.filter((m: any) =>
    m?.labelIds?.includes("UNREAD") && m?.labelIds?.includes("INBOX")
  ).length;

  const sentToday = allMessages.filter((m: any) =>
    m?.labelIds?.includes("SENT") &&
    new Date(m?.createdAt).toDateString() === today
  ).length;

  const draftCount = allMessages.filter((m: any) =>
    m?.labelIds?.includes("DRAFT")
  ).length;

  const recentMessages = allMessages
    .filter((m: any) => m?.labelIds?.includes("INBOX"))
    .sort((a: any, b: any) =>
      new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
    )
    .slice(0, 10);

  // Labels still need a live API call — no label data in message cache
  const labels = (await tenant.gmail.api.labels.list({})).labels?.filter(
    (l) => l.type === "user" || ["INBOX", "SENT", "DRAFT"].includes(l.id ?? "")
  ) ?? [];

  return { recentMessages, unreadCount, sentToday, draftCount, labels };
}

async function getTodayEvents(userId: string) {
  const tenant = corsair.withTenant(userId);
  const { timeMin, timeMax } = getTodayRange();

  try {
    const result = await tenant.googlecalendar.api.events.getMany({
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 10,
    });
    return (result.items ?? []).map(parseEvent);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.id);
  const todayEvents = await getTodayEvents(session.user.id);

  return (
    <DashboardClient 
      userEmail={session.user.email}
      recentMessages={data.recentMessages}
      unreadCount={data.unreadCount}
      sentToday={data.sentToday}
      draftCount={data.draftCount}
      labels={data.labels}
      todayEvents={todayEvents}
    />
  );
}
