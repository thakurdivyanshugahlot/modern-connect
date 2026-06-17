import { processWebhook } from "corsair";
import { corsair } from "@/server/lib/corsair";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { notifyTenant } from "@/server/lib/notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let tenantId: string | undefined;

    if (body?.message?.data) {
      const decoded = JSON.parse(
        Buffer.from(body.message.data, "base64").toString("utf-8")
      );
      const emailAddress = decoded.emailAddress as string | undefined;

      if (emailAddress) {
        const matchedUser = await db.query.user.findFirst({
          where: (user, { eq }) => eq(user.email, emailAddress),
        });
        tenantId = matchedUser?.id;
      }
    }

    if (!tenantId) {
      console.warn("[webhook] Could not resolve tenant for incoming webhook");
      return NextResponse.json({ ok: true });
    }

    const result = await processWebhook(
      corsair,
      Object.fromEntries(req.headers),
      body,
      { tenantId }
    );

    console.log("[webhook] Processed:", result.plugin, result.action);

    // Broadcast to any connected SSE clients for this tenant
    if (result.plugin === "gmail" && result.action === "messageChanged") {
      await notifyTenant(tenantId, { type: "new_email" });
    }
    if (result.plugin === "googlecalendar") {
      await notifyTenant(tenantId, { type: "calendar_updated" });
    }

    if (result.response instanceof Response) {
      return result.response;
    }

    return NextResponse.json(result.response ?? { ok: true });
  } catch (e) {
    console.error("[webhook] Error processing webhook");
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}