import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { corsair } from "@/server/lib/corsair";
import { db } from "@/server/db";
import { requireSession } from "@/server/lib/session";
import { getTodayRange, parseEvent } from "@/server/lib/calendar-utils";
import DashboardClient from "@/components/client/DashboardClient";

// A new user can land here before their Corsair account row has been
// provisioned (OAuth callback failed or hasn't completed). Any account-level
// read below would throw "Account not found for tenant ...". Detect that up
// front and re-trigger OAuth instead of crashing the render.
async function gmailAccountExists(userId: string): Promise<boolean> {
  const gmailIntegration = await db.query.corsairIntegrations.findFirst({
    where: (t, { eq }) => eq(t.name, "gmail"),
  });
  if (!gmailIntegration) return false;

  const account = await db.query.corsairAccounts.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.integrationId, gmailIntegration.id), eq(t.tenantId, userId)),
  });
  return !!account;
}



// Cached per user for 30s. Without this, every dashboard render issued a live
// Gmail `labels.list` API round-trip to Google. Tagged "gmail" so archive/trash
// server actions (which call updateTag("gmail")) get read-your-writes freshness.
const getDashboardData = unstable_cache(
  async (userId: string) => getDashboardDataUncached(userId),
  ["dashboard-data"],
  { revalidate: 30, tags: ["gmail"] },
);

async function getDashboardDataUncached(userId: string) {
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

// Cached per user for 30s — replaces a live Google Calendar API round-trip on
// every dashboard render. Tagged "calendar" for targeted revalidation.
const getTodayEvents = unstable_cache(
  async (userId: string) => getTodayEventsUncached(userId),
  ["dashboard-today-events"],
  { revalidate: 30, tags: ["calendar"] },
);

async function getTodayEventsUncached(userId: string) {
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

  // Guard: if the Corsair account isn't provisioned yet, re-run OAuth rather
  // than letting getAccount() crash the Server Component.
  if (!(await gmailAccountExists(session.user.id))) {
    redirect("/api/auth/gmail");
  }

  // Independent fetches — run concurrently instead of sequentially.
  const [data, todayEvents] = await Promise.all([
    getDashboardData(session.user.id),
    getTodayEvents(session.user.id),
  ]);

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