import ChatClient from "@/components/client/ChatClient";
import { requireSession } from "@/server/lib/session";




export default async function ChatPage() {
  const session = await requireSession();
  return <ChatClient userEmail={session.user.email} userName={session.user.name} />;
}