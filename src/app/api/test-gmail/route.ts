// src/app/api/test-gmail/route.ts

import { corsair } from "@/server/lib/corsair";

export async function GET() {
  const tenant = corsair.withTenant("abc");

  const labels =
    await tenant.gmail.api.labels.list({
    
    });

  return Response.json(labels);
}