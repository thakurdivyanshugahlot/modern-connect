// src/server/lib/session.ts
import { auth } from "@/server/lib/auth";
import { setupCorsair } from "corsair";
import { corsair, bootstrapCorsairCredentials } from "@/server/lib/corsair";
import { db } from "@/server/db";
import { devLog } from "@/server/lib/logger";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Provisions the Corsair account row (gmail + calendar) for a tenant the first
// time we see them. Without it, the account-level key setters below — and any
// later account read — throw "Account not found for tenant ...". Gated on a
// cheap existence check so setupCorsair only runs once per new user, not on
// every request. setupCorsair is idempotent regardless.
async function ensureCorsairAccount(userId: string): Promise<void> {
  const integration = await db.query.corsairIntegrations.findFirst({
    where: (t, { eq }) => eq(t.name, "gmail"),
  });
  const account = integration
    ? await db.query.corsairAccounts.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.integrationId, integration.id), eq(t.tenantId, userId)),
      })
    : null;

  if (!account) {
    await bootstrapCorsairCredentials();
    await setupCorsair(corsair, { tenantId: userId, caller: "script" });
  }
}

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  try {
    const tenant = corsair.withTenant(session.user.id);

    // Make sure the tenant's Corsair account exists before we touch any
    // account-level keys — this is what self-heals brand-new users on their
    // first protected page load (inbox, dashboard, calendar, chat).
    await ensureCorsairAccount(session.user.id);

    // Get access token from Better Auth
    const tokenData = await auth.api.getAccessToken({
      body: {
        userId: session.user.id,
        providerId: "google",
      },
      headers: await headers(),
    });

    devLog("[session] Token data:", !!tokenData?.accessToken);

    if (tokenData?.accessToken) {
      await tenant.gmail.keys.set_access_token(tokenData.accessToken);
      devLog("[session] Access token synced to Corsair");

      if (tokenData.accessTokenExpiresAt) {
        await tenant.gmail.keys.set_expires_at(
          tokenData.accessTokenExpiresAt.toISOString()
        );
      }
    }

    // Also sync refresh token directly from DB since getAccessToken doesn't return it
    const googleAccount = await db.query.account.findFirst({
      where: (account, { eq, and }) =>
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "google")
        ),
    });

    devLog("[session] Google account in DB:", !!googleAccount, "refresh token:", !!googleAccount?.refreshToken);

    if (googleAccount?.refreshToken) {
      await tenant.gmail.keys.set_refresh_token(googleAccount.refreshToken);
      devLog("[session] Refresh token synced to Corsair");
    }

    if (googleAccount?.accessToken) {
      await tenant.gmail.keys.set_access_token(googleAccount.accessToken);
    }

  } catch (e) {
    devLog("[session] Token sync failed:", e);
  }

  return session;
}