import { corsair } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageDetailClient from "@/components/client/MessageDetailClient";


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

function NotFound() {
  return (
    <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
        <ArrowLeft className="h-8 w-8 text-zinc-700" />
      </div>
      <h2 className="text-xl font-bold text-zinc-200">Message not found</h2>
      <p className="text-sm text-zinc-500 mt-2 max-w-xs leading-relaxed">
        We couldn't locate this email. It may have been deleted or hasn't synced to your workspace yet.
      </p>
      <Link href="/gmail" className="mt-8">
        <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-xl px-6">
          Return to Inbox
        </Button>
      </Link>
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

  return <MessageDetailClient message={message} />;
}