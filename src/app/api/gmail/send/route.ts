// src/app/api/gmail/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { corsair } from "@/server/lib/corsair";
import { buildRawMessage } from "@/server/lib/gmail-utils";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, subject, body, html, threadId } = await req.json();

  // In prod, get the user's real Gmail address from their profile
  const from = "me"; // Gmail API accepts "me" as alias

  const raw = buildRawMessage({ from, to, subject, body, html });

  const tenant = corsair.withTenant(session.user.id);

  const result = await tenant.gmail.api.messages.send({
    raw,
    ...(threadId ? { threadId } : {}), // attach to existing thread
  });

  return NextResponse.json(result);
}