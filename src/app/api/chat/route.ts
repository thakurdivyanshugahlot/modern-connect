// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/lib/session";
import { corsair } from "@/server/lib/corsair";
import { OpenAI } from "openai";
import {
  Agent,
  run,
  tool,
  setTracingDisabled,
  setOpenAIAPI,
  setDefaultOpenAIClient,
} from "@openai/agents";
import { OpenAIAgentsProvider } from "@corsair-dev/mcp";

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

  const tenantCorsair = corsair.withTenant(session.user.id);

  const provider = new OpenAIAgentsProvider();
  // ✅ provider.build() is async — must be awaited
  const tools = await provider.build({ corsair: tenantCorsair, tool });

  const agent = new Agent({
    name: "modern-connect-agent",
    model: "gemini-2.5-flash",
    instructions: `You have access to Corsair tools for Gmail and Google Calendar.
Use list_operations to discover available APIs, get_schema to understand required arguments, and run_script to execute them.
When referencing resources, always use their ID not their name.
Available plugins are 'gmail' and 'googlecalendar'.
Today is ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
The user's timezone is Asia/Kolkata (IST).

CALENDAR EVENTS — always use this exact shape:
{
  summary: "Meeting title",
  description: "optional description",
  start: { dateTime: "2026-06-18T20:00:00+05:30", timeZone: "Asia/Kolkata" },
  end:   { dateTime: "2026-06-18T21:00:00+05:30", timeZone: "Asia/Kolkata" },
  attendees: [{ email: "recipient@gmail.com" }]
}
- dateTime MUST be ISO 8601 with IST offset (+05:30), never UTC
- Always include timeZone: "Asia/Kolkata" in both start and end
- Default duration is 1 hour

TO POSTPONE A MEETING:
1. First call googlecalendar.api.events.list or search to find the event by title/date
2. Get the event ID from the result
3. Call googlecalendar.api.events.update (NOT create) with the event ID and new start/end times
4. Then send an email informing the attendees of the change

GMAIL — to send email use gmail.api.messages.send with a base64url-encoded RFC 2822 message.
When asked to inform someone about a meeting change, send both:
1. A calendar update (events.update with new time)
2. A plain email informing them of the change`,
    tools,
  });

  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await run(agent, [
        ...history,
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

  return NextResponse.json({
    response: result?.finalOutput,
    history: result?.history ?? [],
  });
}
