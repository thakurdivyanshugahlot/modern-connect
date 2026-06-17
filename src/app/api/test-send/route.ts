// src/app/api/test-send/route.ts

import { corsair } from "@/server/lib/corsair";

export async function GET() {
  const tenant = corsair.withTenant("abc");

  const email = [
    "From: divithakur2580@gmail.com",
    "To: anjaliofficial0318@gmail.com",
    "Subject: Corsair Test",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "Hello from Corsair",
  ].join("\r\n");

  const raw = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const result =
    await tenant.gmail.api.messages.send({
      raw,
    });

  return Response.json(result);
}