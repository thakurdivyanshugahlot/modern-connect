// src/app/gmail/page.tsx
import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import Link from "next/link";

interface CachedMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  body: string;
  htmlBody?: string;
  createdAt: string;
  labelIds: string[];
}

async function getInboxMessages(userId: string): Promise<CachedMessage[]> {
  const tenant = corsair.withTenant(userId);

  const cached = await tenant.gmail.db.messages.list({});

  return (cached ?? [])
    .map((row: any) => row.data as CachedMessage)
    .filter((msg) => msg.labelIds?.includes("INBOX"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 25);
}

function MessageRow({ msg }: { msg: CachedMessage }) {
  return (
    <li>
      <Link
        href={`/gmail/${msg.id}`}
        className="flex items-center py-3 px-2 hover:bg-gray-50 rounded gap-4"
      >
        <span className="w-48 shrink-0 truncate font-medium text-sm">
          {msg.from}
        </span>
        <span className="flex-1 truncate text-sm">
          <span className="font-medium">{msg.subject}</span>
          <span className="text-gray-400"> — </span>
          <span className="text-gray-500">{msg.snippet}</span>
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
          {new Date(msg.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </span>
      </Link>
    </li>
  );
}

export default async function InboxPage() {
  const session = await requireSession();
  const messages = await getInboxMessages(session.user.id);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Inbox</h1>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No messages</p>
        </div>
      ) : (
        <ul className="divide-y">
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
        </ul>
      )}
    </div>
  );
}