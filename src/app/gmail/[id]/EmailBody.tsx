// src/app/gmail/[id]/EmailBody.tsx  ← NEW FILE
"use client";

import type { ParsedMessage } from "@/server/lib/gmail-utils";
interface EmailMessage {
  body: string;
  htmlBody?: string;
}


export function EmailBody({ message }: { message: EmailMessage }) {
  if (message.htmlBody) {
    return (
      <iframe
        srcDoc={message.htmlBody}
        sandbox="allow-same-origin"
        className="w-full border-0"
        style={{ minHeight: "600px" }}
        title="Email content"
        onLoad={(e) => {
          const iframe = e.currentTarget;
          const height = iframe.contentDocument?.documentElement?.scrollHeight;
          if (height) iframe.style.height = `${height}px`;
        }}
      />
    );
  }

  return (
    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
      {message.body}
    </pre>
  );
}