// src/app/api/test-db-cache/route.ts
import { corsair } from "@/server/lib/corsair";
import { NextResponse } from "next/server";

export async function GET() {
  const tenant = corsair.withTenant("0YvHBHHbHRQKdGA7kxWVtkvZzwortnK3");

  const messages = await tenant.gmail.db.messages.list({});

  const sorted = (messages ?? []).sort((a: any, b: any) =>
    new Date(b.createdAt ?? b.created_at).getTime() -
    new Date(a.createdAt ?? a.created_at).getTime()
  );

  return NextResponse.json({
    count: messages?.length ?? 0,
    mostRecent: sorted[0] ?? null,
    secondRecent: sorted[1] ?? null,
  });
}