// src/app/gmail/compose/page.tsx
"use client";
import { useState } from "react";

export default function ComposePage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) throw new Error("Send failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">New Message</h1>
      <input
        className="w-full border rounded px-3 py-2 text-sm"
        placeholder="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        className="w-full border rounded px-3 py-2 text-sm"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className="w-full border rounded px-3 py-2 text-sm h-48"
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        onClick={handleSend}
        disabled={status === "sending"}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>
      {status === "sent" && <p className="text-green-600 text-sm">Sent!</p>}
      {status === "error" && <p className="text-red-600 text-sm">Something went wrong.</p>}
    </div>
  );
}