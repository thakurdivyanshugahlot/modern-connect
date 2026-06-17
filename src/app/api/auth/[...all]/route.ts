import { auth } from "@/server/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { corsair, bootstrapCorsairCredentials } from "@/server/lib/corsair";
import { setupCorsair } from "corsair";
import { getTodayRange } from "@/server/lib/calendar-utils";

bootstrapCorsairCredentials().catch(console.error);

const { GET: _GET, POST } = toNextJsHandler(auth);
export { POST };

// ── Programmatic replacements for CLI calls ───────────────────────────────────

async function registerGmailWatch(accessToken: string) {
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/watch",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName: process.env.GMAIL_PUBSUB_TOPIC!,
        labelIds: ["INBOX"],
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail watch failed: ${err}`);
  }
  const data = await res.json();
  console.log(
    "[auth] Gmail watch registered. Expiration:",
    new Date(Number(data.expiration)).toISOString(),
  );
}

async function registerCalendarWatch(accessToken: string) {
  const channelId = crypto.randomUUID();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: process.env.WEBHOOK_URL!,
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar watch failed: ${err}`);
  }
  const data = await res.json();
  console.log(
    "[auth] Calendar watch registered. Expiration:",
    new Date(Number(data.expiration)).toISOString(),
  );
}

// ── Auth route ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const response = await _GET(req);

  try {
    if (url.pathname === "/api/auth/callback/google") {
      const setCookie = response.headers.get("set-cookie") ?? "";
      const sessionToken = setCookie.match(
        /better-auth\.session_token=([^;]+)/,
      )?.[1];

      if (sessionToken) {
        const session = await auth.api.getSession({
          headers: new Headers({
            cookie: `better-auth.session_token=${sessionToken}`,
          }),
        });

        if (session?.user?.id) {
          const userId = session.user.id;

          // Check existing provisioning
          const [gmailIntegration, calendarIntegration] = await Promise.all([
            db.query.corsairIntegrations.findFirst({
              where: (t, { eq }) => eq(t.name, "gmail"),
            }),
            db.query.corsairIntegrations.findFirst({
              where: (t, { eq }) => eq(t.name, "googlecalendar"),
            }),
          ]);

          const [existingGmail, existingCalendar] = await Promise.all([
            gmailIntegration
              ? db.query.corsairAccounts.findFirst({
                  where: (t, { eq, and }) =>
                    and(
                      eq(t.integrationId, gmailIntegration.id),
                      eq(t.tenantId, userId),
                    ),
                })
              : null,
            calendarIntegration
              ? db.query.corsairAccounts.findFirst({
                  where: (t, { eq, and }) =>
                    and(
                      eq(t.integrationId, calendarIntegration.id),
                      eq(t.tenantId, userId),
                    ),
                })
              : null,
          ]);

          // Provision accounts (replaces: npx corsair setup --plugin=X --tenant=Y)
          if (!existingGmail || !existingCalendar) {
            // Temporarily suppress Corsair's verbose setup logs in production
            const originalLog = console.log;
            const originalWarn = console.warn;
            if (process.env.NODE_ENV === "production") {
              console.log = () => {};
              console.warn = () => {};
            }

            try {
              await setupCorsair(corsair, {
                tenantId: userId,
                caller: "script",
              });
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
            }
          }

          // Sync tokens
          const tenant = corsair.withTenant(userId);
          const googleAccount = await db.query.account.findFirst({
            where: (account, { eq, and }) =>
              and(eq(account.userId, userId), eq(account.providerId, "google")),
          });

          if (googleAccount?.accessToken) {
            await tenant.gmail.keys.set_access_token(googleAccount.accessToken);
            await tenant.googlecalendar.keys.set_access_token(
              googleAccount.accessToken,
            );
          }
          if (googleAccount?.refreshToken) {
            await tenant.gmail.keys.set_refresh_token(
              googleAccount.refreshToken,
            );
            await tenant.googlecalendar.keys.set_refresh_token(
              googleAccount.refreshToken,
            );
          }
          if (googleAccount?.accessTokenExpiresAt) {
            const iso = googleAccount.accessTokenExpiresAt.toISOString();
            await tenant.gmail.keys.set_expires_at(iso);
            await tenant.googlecalendar.keys.set_expires_at(iso);
          }

          // Register webhooks (replaces: npx corsair auth --plugin=X --webhook --tenant=Y)
          if (googleAccount?.accessToken) {
            if (!existingGmail) {
              await registerGmailWatch(googleAccount.accessToken).catch((e) =>
                console.error(
                  "[auth] Gmail watch registration failed:",
                  e.message,
                ),
              );

              // Backfill last 20 inbox messages into cache
              try {
                const list = await tenant.gmail.api.messages.list({
                  maxResults: 20,
                  q: "in:inbox",
                });
                if (list.messages) {
                  await Promise.all(
                    list.messages
                      .filter((m): m is { id: string } => !!m.id)
                      .map((m) =>
                        tenant.gmail.api.messages.get({
                          id: m.id,
                          format: "full",
                        }),
                      ),
                  );
                }
              } catch (e) {
                console.error(
                  "[auth] Gmail backfill failed:",
                  e instanceof Error ? e.message : e,
                );
              }
            }

            if (!existingCalendar) {
              await registerCalendarWatch(googleAccount.accessToken).catch(
                (e) =>
                  console.error(
                    "[auth] Calendar watch registration failed:",
                    e.message,
                  ),
              );

              // Backfill next 30 days of calendar events into cache
              try {
                const { timeMin } = getTodayRange();
                await tenant.googlecalendar.api.events.getMany({
                  timeMin,
                  timeMax: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                  singleEvents: true,
                  orderBy: "startTime",
                  maxResults: 50,
                });
              } catch (e) {
                console.error(
                  "[auth] Calendar backfill failed:",
                  e instanceof Error ? e.message : e,
                );
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("[auth:route] Error:", e);
  }

  return response;
}
