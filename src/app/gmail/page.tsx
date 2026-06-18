import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import InboxClient from "./InboxClient";

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

  const uniqueMessages = new Map<string, CachedMessage>();
  for (const row of (cached ?? [])) {
    const msg = row.data as unknown as CachedMessage;
    if (msg?.id) {
      uniqueMessages.set(msg.id, msg);
    }
  }

  return Array.from(uniqueMessages.values())
    .filter((msg) => msg.labelIds?.includes("INBOX"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

export default async function InboxPage() {
  const session = await requireSession();
  const messages = await getInboxMessages(session.user.id);

  return <InboxClient messages={messages} />;
}
