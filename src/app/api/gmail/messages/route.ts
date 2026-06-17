// src/app/api/gmail/messages/route.ts
import { NextResponse } from "next/server";
import { corsair } from "@/server/lib/corsair";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const q = searchParams.get("q") ?? undefined; // Gmail search query e.g. "is:unread"

  const tenant = corsair.withTenant(session.user.id);

  const messages = await tenant.gmail.api.messages.list({
    maxResults: 20,
    pageToken,
    q,
  });

  return NextResponse.json(messages);
}