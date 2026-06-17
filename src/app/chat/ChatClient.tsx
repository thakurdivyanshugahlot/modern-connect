// src/app/chat/ChatClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function ChatClient({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.response ?? "No response." },
      ]);
      setHistory(data.history ?? []);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
          AI
        </div>
        <div>
          <p className="font-semibold text-sm">Modern Connect Assistant</p>
          <p className="text-xs text-gray-400">{userEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-2xl mb-2">👋</p>
            <p className="font-medium text-gray-300">Hi {userName}!</p>
            <p className="text-sm mt-1">
              Try: "Summarize my unread emails" or "What's on my calendar this week?"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-3 rounded-2xl max-w-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-800 text-gray-100 rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-400 flex gap-1.5 items-center">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce [animation-delay:0.15s]">●</span>
              <span className="animate-bounce [animation-delay:0.3s]">●</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 placeholder-gray-500"
            placeholder="Ask about your emails or calendar..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">
          Powered by Gemini · Your data stays private
        </p>
      </div>
    </div>
  );
}