import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import {corsair} from '@/server/lib/corsair'
import { requireSession } from "@/server/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "http://localhost:3000/api/auth/gmail/callback"
  );

const { tokens } = await oauth2Client.getToken(code!);
// src/app/api/auth/gmail/callback/route.ts
  const session = await requireSession();               // ← get real user
  const tenant = corsair.withTenant(session.user.id);  // ← scope to them

  // ...exchange code, then store tokens as before
  await tenant.gmail.keys.set_refresh_token(tokens.refresh_token!);
  await tenant.gmail.keys.set_access_token(tokens.access_token!);

  return NextResponse.redirect(new URL("/gmail/dashboard", req.url));

}