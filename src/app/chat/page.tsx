import { requireSession } from "@/server/lib/session";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const session = await requireSession();
  return <ChatClient userEmail={session.user.email} userName={session.user.name} />;
}