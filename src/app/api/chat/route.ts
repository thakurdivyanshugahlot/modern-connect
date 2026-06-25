// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/lib/session";
import { corsair } from "@/server/lib/corsair";
import { OpenAI } from "openai";
import { createHash } from "crypto";
import {
  Agent,
  run,
  tool,
  setTracingDisabled,
  setOpenAIAPI,
  setDefaultOpenAIClient,
} from "@openai/agents";
import { OpenAIAgentsProvider } from "@corsair-dev/mcp";
import {
  classifyIntent,
  classifyReadTarget,
} from "@/server/lib/intent-classifier";
import { redis, checkRateLimit, incrementRateLimit } from "@/server/lib/redis";
import { buildRawMessage } from "@/server/lib/gmail-utils";
import { z } from "zod";

const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  maxRetries: 3,
  timeout: 60000,
});

setDefaultOpenAIClient(geminiClient);
setOpenAIAPI("chat_completions");
setTracingDisabled(true);

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { message, history } = await req.json();

  // Fix null-safety for new conversations
  const safeHistory = history ?? [];

  // --- THING 1: INTENT CLASSIFICATION ---
  const intent = classifyIntent(message);
  const tenantCorsair = corsair.withTenant(session.user.id);

  // DETERMINISTIC_READ Short-circuit
  if (intent === "DETERMINISTIC_READ") {
    try {
      let resultText = "";
      const target = classifyReadTarget(message);

      if (target === "EMAIL") {
        const all = await tenantCorsair.gmail.db.messages.list({});
        const unread = (all ?? []).filter((row: any) =>
          row.data?.labelIds?.includes("UNREAD"),
        );
        resultText = `You have ${unread.length} unread emails.`;
      } else if (target === "CALENDAR") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tonight = new Date();
        tonight.setHours(23, 59, 59, 999);

        const all = await tenantCorsair.googlecalendar.db.events.list({});
        const todayEvents = (all ?? []).filter((row: any) => {
          const start = row.data?.start?.dateTime ?? row.data?.start?.date;
          if (!start) return false;
          const d = new Date(start);
          return d >= today && d <= tonight;
        });

        resultText =
          todayEvents.length > 0
            ? `You have ${todayEvents.length} meeting${todayEvents.length > 1 ? "s" : ""} today.`
            : "You have no meetings scheduled for today.";
      } else if (target === "LABELS") {
        const labels = await tenantCorsair.gmail.db.labels.list({});
        const labelNames = (labels ?? [])
          .map((row: any) => row.data?.name)
          .filter(Boolean);
        resultText =
          labelNames.length > 0
            ? `Your labels: ${labelNames.join(", ")}.`
            : "You don't have any custom labels.";
      } else {
        resultText = "Try asking about unread emails or today's meetings.";
      }

      return NextResponse.json({
        response: resultText,
        history: [
          ...safeHistory,
          { role: "user", content: message },
          { role: "assistant", content: resultText },
        ],
      });
    } catch (dbErr) {
      console.error(
        "[Deterministic] DB fetch failed, falling back to LLM:",
        dbErr,
      );
    }
  }

  // --- THING 3: RESPONSE CACHING (LLM_READ only, no pronouns) ---
  const isCacheable =
    intent === "LLM_READ" && !/\b(it|that|those|them|they)\b/i.test(message);
  const cacheKey = `cache:chat:${session.user.id}:${createHash("sha256").update(message).digest("hex")}`;

  if (isCacheable) {
    try {
      const cachedResponse = await redis.get(cacheKey);
      if (cachedResponse) {
        return NextResponse.json({
          response: cachedResponse,
          history: [
            ...safeHistory,
            { role: "user", content: message },
            { role: "assistant", content: cachedResponse },
          ],
          fromCache: true,
        });
      }
    } catch (err) {
      console.error("[Redis] Cache hit failed (fail-open):", err);
    }
  }

  // --- THING 2: RATE LIMITING ---
  const quota = await checkRateLimit(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error:
          "You've used all 20 free AI requests for today. Upgrade to Pro for unlimited access. Resets at midnight.",
      },
      { status: 403 },
    );
  }

  // --- THING 3: HISTORY TRIMMING ---
  const trimmedHistory = safeHistory.slice(-6);

  const provider = new OpenAIAgentsProvider();
  const mcpTools = await provider.build({ corsair: tenantCorsair, tool });

  // High-level send tool — builds the RFC 2822 / base64url `raw` payload
  // internally so the model never has to hand-construct MIME inside run_script.
  const sendEmailTool = tool({
    name: "send_email",
    description:
      "Send an email via Gmail. Prefer this over run_script for sending mail — it builds the raw MIME message for you. Provide plain text in `body`. Pass `threadId` only when replying to an existing thread.",
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Plain text email body"),
      threadId: z
        .string()
        .nullable()
        .optional()
        .describe("Existing Gmail thread ID to reply within, if any"),
    }),
    async execute({ to, subject, body, threadId }) {
      try {
        const raw = buildRawMessage({ from: "me", to, subject, body });
        const result = await tenantCorsair.gmail.api.messages.send({
          raw,
          ...(threadId ? { threadId } : {}),
        });
        return { success: true, messageId: result?.id };
      } catch (err: any) {
        return { success: false, error: err?.message ?? String(err) };
      }
    },
  });

  const tools = [...mcpTools, sendEmailTool];

  const agent = new Agent({
    name: "modern-connect-agent",
    model: "gemini-2.5-flash",
    instructions: `You have access to Corsair tools for Gmail and Google Calendar.
Use list_operations to discover available APIs, get_schema to understand required arguments, and run_script to execute them.
To send an email, ALWAYS use the dedicated send_email tool — do NOT build raw MIME or call gmail.api.messages.send via run_script.
When referencing resources, always use their ID not their name.
Available plugins are 'gmail' and 'googlecalendar'.
Today is ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
The user's timezone is Asia/Kolkata (IST).
Sign emails with the sender's real name "${session.user.name}" — never use placeholder text like [Your Name].

CALENDAR EVENTS
ALWAYS use this exact shape for googlecalendar.api.events.create:
{
  calendarId: "primary",
  event: {
    summary: "Meeting title",
    description: "optional description",
    start: { dateTime: "2026-06-18T20:00:00+05:30", timeZone: "Asia/Kolkata" },
    end: { dateTime: "2026-06-18T21:00:00+05:30", timeZone: "Asia/Kolkata" },
    attendees: [{ email: "recipient@gmail.com" }]
  },
  sendUpdates: "all"
}

NEVER use:
{ resource: {...} }
The Corsair SDK requires the event property, not resource.

- sendUpdates: "all" is REQUIRED on every events.create and events.update 
  call with attendees — without it, no invite email is sent.
- dateTime MUST be ISO 8601 with IST offset (+05:30), never UTC
- Always include timeZone: "Asia/Kolkata" in both start and end
- Default duration is 1 hour`,
    tools,
  });

  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await run(agent, [
        ...trimmedHistory,
        { role: "user", content: message },
      ]);
      break;
    } catch (err: any) {
      if (err?.status === 429 && attempt < 3) {
        console.log(`Rate limited. Waiting 30s before retry ${attempt}/3...`);
        await sleep(30000);
      } else {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }
  }

  const finalResponse = result?.finalOutput;

  // Save to Cache if cacheable
  if (isCacheable && finalResponse) {
    try {
      await redis.set(cacheKey, finalResponse, "EX", 60 * 5); // 5 minute TTL
    } catch (err) {
      console.error("[Redis] Cache set failed:", err);
    }
  }

  // Increment Rate Limit only on successful LLM call
  await incrementRateLimit(session.user.id);

  return NextResponse.json({
    response: finalResponse,
    history: [
      ...safeHistory,
      { role: "user", content: message },
      { role: "assistant", content: finalResponse },
    ],
  });
}




