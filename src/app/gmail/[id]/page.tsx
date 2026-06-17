// src/app/gmail/[id]/page.tsx
import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import Link from "next/link";
import { EmailBody } from "./EmailBody";

interface CachedMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date?: string;
  createdAt?: Date | string | null;
  snippet: string;
  body: string;
  htmlBody?: string;
}
async function getMessage(
  userId: string,
  id: string,
): Promise<CachedMessage | null> {
  const tenant = corsair.withTenant(userId);

  const cached = await tenant.gmail.db.messages.list({});

  const match = (cached ?? []).find(
    (row: any) => row.data?.id === id || row.entity_id === id,
  );

  return match ? (match.data as CachedMessage) : null;
}

function MessageHeader({ message }: { message: CachedMessage }) {
  return (
    <div className="mb-6">
      <Link
        href="/gmail"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Inbox
      </Link>
      <h1 className="text-xl font-semibold mb-3">{message.subject}</h1>
      <div className="flex flex-col gap-1 text-sm text-gray-500">
        <span>
          <span className="font-medium text-gray-700">From:</span>{" "}
          {message.from}
        </span>
        <span>
          <span className="font-medium text-gray-700">To:</span> {message.to}
        </span>
        <span>
          <span className="font-medium text-gray-700">Date:</span>{" "}
          {message.date ??
            (message.createdAt
              ? new Date(message.createdAt).toLocaleString()
              : "Unknown")}
        </span>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/gmail"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Inbox
      </Link>
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Message not found</p>
        <p className="text-sm mt-1">
          It may not have synced yet — try refreshing the inbox.
        </p>
      </div>
    </div>
  );
}

export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const message = await getMessage(session.user.id, id);

  if (!message) {
    return <NotFound />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <MessageHeader message={message} />
      <hr className="mb-6" />
      <EmailBody message={message} />
    </div>
  );
}
