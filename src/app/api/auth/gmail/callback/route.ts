import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { setupCorsair } from "corsair";
import { corsair, bootstrapCorsairCredentials } from "@/server/lib/corsair";
import { requireSession } from "@/server/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "http://localhost:3000/api/auth/gmail/callback"
  );

  const { tokens } = await oauth2Client.getToken(code!);
  const session = await requireSession();               // ← get real user
  const tenant = corsair.withTenant(session.user.id);  // ← scope to them

  // Ensure the Corsair account row exists for this tenant + gmail/calendar
  // integrations BEFORE writing any account-level keys. Without it, the
  // account-level key setters (and later reads like api.labels.list) throw
  // "Account not found for tenant ... Make sure to create the account first".
  // setupCorsair is idempotent, so existing users are unaffected; wrap
  // defensively so a provisioning hiccup never blocks the token write.
  try {
    await bootstrapCorsairCredentials();
    await setupCorsair(corsair, {
      tenantId: session.user.id,
      caller: "script",
    });
  } catch (e) {
    console.error("[gmail callback] Corsair account provisioning failed:", e);
  }

  // ...exchange code, then store tokens as before
  await tenant.gmail.keys.set_refresh_token(tokens.refresh_token!);
  await tenant.gmail.keys.set_access_token(tokens.access_token!);

  return NextResponse.redirect(new URL("/gmail/dashboard", req.url));

}