// src/server/lib/gmail-utils.ts

import { unstable_cache } from "next/cache";
import { corsair } from "@/server/lib/corsair";

export interface CachedMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  body: string;
  htmlBody?: string;
  createdAt: string;
  labelIds: string[];
}

async function getInboxMessages(userId: string): Promise<CachedMessage[]> {
  const tenant = corsair.withTenant(userId);
  const cached = await tenant.gmail.db.messages.list({});

  const uniqueMessages = new Map<string, CachedMessage>();
  for (const row of (cached ?? [])) {
    const msg = row.data as unknown as CachedMessage;
    if (msg?.id) {
      uniqueMessages.set(msg.id, msg);
    }
  }

  return Array.from(uniqueMessages.values())
    .filter((msg) => msg.labelIds?.includes("INBOX"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

export const getCachedInboxMessages = unstable_cache(
  async (userId: string) => getInboxMessages(userId),
  ["inbox-messages"],
  { revalidate: 30, tags: ["gmail"] }
);

export interface ParsedMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string; // plain text
  htmlBody?: string;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractBody(payload: any): { text: string; html?: string } {
  // Flat message (no multipart)
  if (payload.body?.data) {
    return { text: decodeBase64Url(payload.body.data) };
  }

  let text = "";
  let html: string | undefined;

  // Multipart message — walk parts
  for (const part of payload.parts ?? []) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      text = decodeBase64Url(part.body.data);
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64Url(part.body.data);
    }
    // Nested multipart/alternative
    if (part.mimeType?.startsWith("multipart/") && part.parts) {
      const nested = extractBody(part);
      if (nested.text) text = nested.text;
      if (nested.html) html = nested.html;
    }
  }

  return { text, html };
}

export function parseGmailMessage(raw: any): ParsedMessage {
  const headers = raw.payload?.headers ?? [];
  const { text, html } = extractBody(raw.payload);

  return {
    id: raw.id,
    threadId: raw.threadId,
    subject: getHeader(headers, "Subject"),
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    date: getHeader(headers, "Date"),
    snippet: raw.snippet ?? "",
    body: text,
    htmlBody: html,
  };
}

// src/server/lib/gmail-utils.ts (add to existing file)

export interface ComposeOptions {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyToMessageId?: string; // for threading
  threadId?: string;
}

export function buildRawMessage(opts: ComposeOptions): string {
  const boundary = `boundary_${Date.now()}`;

  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `MIME-Version: 1.0`,
  ];

  if (opts.replyToMessageId) {
    headers.push(`In-Reply-To: ${opts.replyToMessageId}`);
    headers.push(`References: ${opts.replyToMessageId}`);
  }

  let body: string;

  if (opts.html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      opts.body,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      opts.html,
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    headers.push(`Content-Type: text/plain; charset=UTF-8`);
    body = opts.body;
  }

  const email = [...headers, "", body].join("\r\n");

  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}