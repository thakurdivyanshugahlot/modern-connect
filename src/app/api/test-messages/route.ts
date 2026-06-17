// src/app/api/test-messages/route.ts

import { corsair } from "@/server/lib/corsair";

export async function GET() {
  const tenant = corsair.withTenant("abc");

 const list =
  await tenant.gmail.api.messages.list({
    maxResults: 1,
  });

const firstId = list.messages?.[0]?.id;

const message =
  await tenant.gmail.api.messages.get({
    id: firstId!,
  });

  return Response.json(message);
}