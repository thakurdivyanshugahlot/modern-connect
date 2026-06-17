// src/app/api/debug-integration/route.ts

import { corsair } from "@/server/lib/corsair";

export async function GET() {
  return Response.json({
    clientId:
      await corsair.keys.gmail.get_client_id(),

    clientSecret:
      await corsair.keys.gmail.get_client_secret(),
  });
}