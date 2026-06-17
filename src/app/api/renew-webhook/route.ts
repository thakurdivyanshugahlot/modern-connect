// src/app/api/cron/renew-webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { corsair } from "@/server/lib/corsair";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await db.query.corsairAccounts.findMany({
    columns: { tenantId: true },
  });
  const uniqueTenants = [...new Set(tenants.map((t) => t.tenantId))];
  const results: Record<string, { gmail: string; calendar: string }> = {};

  for (const tenantId of uniqueTenants) {
    const result = { gmail: "ok", calendar: "ok" };
    const tenant = corsair.withTenant(tenantId);

    try {
      const accessToken = await tenant.gmail.keys.get_access_token();
      if (!accessToken) throw new Error("No access token");

      await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: process.env.GMAIL_PUBSUB_TOPIC!, labelIds: ["INBOX"] }),
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`) });
    } catch (e) {
      result.gmail = e instanceof Error ? e.message : "failed";
    }

    try {
      const accessToken = await tenant.googlecalendar.keys.get_access_token();
      if (!accessToken) throw new Error("No access token");

      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/watch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: crypto.randomUUID(), type: "web_hook", address: process.env.WEBHOOK_URL! }),
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`) });
    } catch (e) {
      result.calendar = e instanceof Error ? e.message : "failed";
    }

    results[tenantId] = result;
  }

  return NextResponse.json({ renewed: uniqueTenants.length, results });
}