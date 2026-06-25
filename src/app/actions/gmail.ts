// src/app/actions/gmail.ts
"use server";

import { revalidatePath, updateTag } from "next/cache";
import { corsair } from "@/server/lib/corsair";
import {
  buildRawMessage,
  getCachedInboxMessages,
  type CachedMessage,
} from "@/server/lib/gmail-utils";
import { requireSession } from "@/server/lib/session";

export async function sendEmailAction(formData: FormData) {
  const session = await requireSession();
  const to = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  const tenant = corsair.withTenant(session.user.id);

  const raw = buildRawMessage({ from: "me", to, subject, body });

  await tenant.gmail.api.messages.send({ raw });

  revalidatePath("/gmail");
  return { success: true };
}

// Read action used as the TanStack Query queryFn on the client.
export async function getInboxMessagesAction(): Promise<CachedMessage[]> {
  const session = await requireSession();
  return getCachedInboxMessages(session.user.id);
}

// Archive = remove the INBOX label (live Gmail API).
export async function archiveMessageAction(id: string) {
  const session = await requireSession();
  const tenant = corsair.withTenant(session.user.id);

  await tenant.gmail.api.messages.modify({ id, removeLabelIds: ["INBOX"] });

  updateTag("gmail"); // read-your-own-writes on the next fresh read
  return { success: true };
}

// Delete = move to Trash (reversible), not a permanent delete.
export async function trashMessageAction(id: string) {
  const session = await requireSession();
  const tenant = corsair.withTenant(session.user.id);

  await tenant.gmail.api.messages.trash({ id });

  updateTag("gmail");
  return { success: true };
}