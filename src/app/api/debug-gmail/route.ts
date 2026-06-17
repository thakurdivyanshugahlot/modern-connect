// src/app/api/debug-gmail/route.ts

import { corsair } from "@/server/lib/corsair";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = corsair.withTenant(session.user.id);

  return Response.json({
    accessToken:
      await tenant.gmail.keys.get_access_token(),

    refreshToken:
      await tenant.gmail.keys.get_refresh_token(),

    scope:
      await tenant.gmail.keys.get_scope(),
  });
}