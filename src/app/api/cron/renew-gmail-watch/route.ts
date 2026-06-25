// src/app/api/cron/renew-gmail-watch/route.ts
//
// Gmail and Google Calendar push subscriptions (users.watch / events.watch)
// expire after 7 days. Vercel Cron hits this endpoint daily (see vercel.json)
// so every connected tenant's subscriptions are re-armed long before they can
// lapse — which is what keeps real-time email + calendar notifications working
// in production. Handles BOTH integrations in a single pass.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { corsair } from "@/server/lib/corsair";

type RenewalReport = { renewed: number; failures: Record<string, string> };

export async function GET(req: NextRequest) {
  // Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when
  // the CRON_SECRET env var is set. Require it so this can't be triggered by
  // the public. (No-op if CRON_SECRET is unset, e.g. local dev.)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Every tenant that has any Corsair account connected. setupCorsair
  // provisions gmail + calendar together, so a tenant here normally has both.
  const accounts = await db.query.corsairAccounts.findMany({
    columns: { tenantId: true },
  });
  const tenantIds = [...new Set(accounts.map((a) => a.tenantId))];

  const gmail: RenewalReport = { renewed: 0, failures: {} };
  const calendar: RenewalReport = { renewed: 0, failures: {} };

  for (const tenantId of tenantIds) {
    const tenant = corsair.withTenant(tenantId);

    // --- Gmail watch ---
    try {
      // Best-effort token refresh + persist via a cheap authenticated SDK call
      // so the raw watch request uses a valid access token even for users who
      // haven't been active recently (get_access_token alone won't refresh).
      await tenant.gmail.api.labels.list({}).catch(() => {});
      const accessToken = await tenant.gmail.keys.get_access_token();
      if (!accessToken) throw new Error("no access token");

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
      if (!res.ok) throw new Error(`watch HTTP ${res.status}: ${await res.text()}`);
      gmail.renewed++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      gmail.failures[tenantId] = message;
      console.error(`[cron:renew-watch] gmail tenant ${tenantId}:`, message);
    }

    // --- Calendar watch ---
    try {
      // Best-effort token refresh, same rationale as Gmail above.
      await tenant.googlecalendar.api.events
        .getMany({ maxResults: 1 })
        .catch(() => {});
      const accessToken = await tenant.googlecalendar.keys.get_access_token();
      if (!accessToken) throw new Error("no access token");

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            type: "web_hook",
            address: process.env.WEBHOOK_URL!,
          }),
        },
      );
      if (!res.ok) throw new Error(`watch HTTP ${res.status}: ${await res.text()}`);
      calendar.renewed++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      calendar.failures[tenantId] = message;
      console.error(`[cron:renew-watch] calendar tenant ${tenantId}:`, message);
    }
  }

  return NextResponse.json({ gmail, calendar });
}
