// src/app/gmail/dashboard/page.tsx
import { corsair } from "@/server/lib/corsair";
import {
  parseGmailMessage,
  type ParsedMessage,
} from "@/server/lib/gmail-utils";
import Link from "next/link";
import { requireSession } from "@/server/lib/session";
import { SignOutButton } from "@/component/SignOutButton";
import {
  parseEvent,
  formatEventTime,
  getTodayRange,
} from "@/server/lib/calendar-utils";
import { NewMailBanner } from "./NewMailBanner";
// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  const tenant = corsair.withTenant(userId);

  // Single DB read — no Gmail API calls
  const cached = await tenant.gmail.db.messages.list({});
  const rows = cached ?? [];

  const today = new Date().toDateString();

  const allMessages = rows.map((row: any) => row.data);

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
    .slice(0, 5);

  // Labels still need a live API call — no label data in message cache
  const labels = (await tenant.gmail.api.labels.list({})).labels?.filter(
    (l) => l.type === "user" || ["INBOX", "SENT", "DRAFT"].includes(l.id ?? "")
  ) ?? [];

  return { recentMessages, unreadCount, sentToday, draftCount, labels };
}

function todayQuery() {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MessageRow({ msg }: { msg: any }) {
  const senderName = (msg.from ?? "")
    .replace(/<.*?>/, "")
    .trim();

  const initials = senderName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/gmail/${msg.id}`}
      className="flex items-center gap-3 py-2.5 px-1 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex items-center justify-center shrink-0">
        {initials || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {senderName}
        </div>
        <div className="text-xs text-gray-400 truncate">{msg.subject}</div>
      </div>
      <div className="text-xs text-gray-300 whitespace-nowrap shrink-0">
        {formatDate(msg.createdAt)}
      </div>
    </Link>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
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
      maxResults: 5,
    });
    return (result.items ?? []).map(parseEvent);
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await requireSession();
  const { recentMessages, unreadCount, sentToday, draftCount, labels } =
    await getDashboardData(session.user.id);

  const todayEvents = await getTodayEvents(session.user.id);

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            User: {session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SignOutButton />
          <Link
            href="/gmail/compose"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Compose
          </Link>
        </div>
      </div>
      <NewMailBanner />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Unread" value={unreadCount} sub="in inbox" />
        <StatCard label="Sent today" value={sentToday} sub="messages" />
        <StatCard label="Drafts" value={draftCount} sub="unsent" />
        <StatCard label="Account" value="Connected" sub="Gmail" />
      </div>
      {/* Recent messages + Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recent messages */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Recent messages
            </span>
            <Link
              href="/gmail"
              className="text-xs text-blue-500 hover:underline"
            >
              View all
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No messages
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentMessages.map((msg) => (
                <MessageRow key={msg.id} msg={msg} />
              ))}
            </div>
          )}
        </div>

        {/* Labels */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Labels
          </div>
          {labels.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No labels found
            </p>
          ) : (
            <div className="space-y-1">
              {labels.slice(0, 8).map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between py-1.5 px-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm text-gray-700">{label.name}</span>
                  </div>
                  {label.messagesUnread ? (
                    <span className="text-xs text-gray-400">
                      {label.messagesUnread} unread
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Today's events
          </span>
          <Link
            href="/calendar"
            className="text-xs text-blue-500 hover:underline"
          >
            View calendar
          </Link>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No events today
          </p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {event.summary}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatEventTime(event.start, event.isAllDay)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
