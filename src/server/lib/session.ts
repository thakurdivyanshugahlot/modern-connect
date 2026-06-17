// src/server/lib/session.ts
import { auth } from "@/server/lib/auth";
import { corsair } from "@/server/lib/corsair";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  try {
    const tenant = corsair.withTenant(session.user.id);

    

    // Get access token from Better Auth
    const tokenData = await auth.api.getAccessToken({
      body: {
        userId: session.user.id,
        providerId: "google",
      },
      headers: await headers(),
    });

    console.log("[session] Token data:", !!tokenData?.accessToken);

    if (tokenData?.accessToken) {
      await tenant.gmail.keys.set_access_token(tokenData.accessToken);
      console.log("[session] Access token synced to Corsair");

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

    console.log("[session] Google account in DB:", !!googleAccount, "refresh token:", !!googleAccount?.refreshToken);

    if (googleAccount?.refreshToken) {
      await tenant.gmail.keys.set_refresh_token(googleAccount.refreshToken);
      console.log("[session] Refresh token synced to Corsair");
    }

    if (googleAccount?.accessToken) {
      await tenant.gmail.keys.set_access_token(googleAccount.accessToken);
    }

  } catch (e) {
    console.error("[session] Token sync failed:", e);
  }

  return session;
}