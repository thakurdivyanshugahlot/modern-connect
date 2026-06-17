// src/app/actions/gmail.ts
"use server";

import { revalidatePath } from "next/cache";
import { corsair } from "@/server/lib/corsair";
import { buildRawMessage } from "@/server/lib/gmail-utils";
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