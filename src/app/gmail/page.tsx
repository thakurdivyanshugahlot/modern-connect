import InboxClient from "@/components/client/InboxClient";
import { requireSession } from "@/server/lib/session";
import { getCachedInboxMessages } from "@/server/lib/gmail-utils";

export default async function InboxPage() {
  const session = await requireSession();
  const messages = await getCachedInboxMessages(session.user.id);

  return <InboxClient messages={messages} />;
}