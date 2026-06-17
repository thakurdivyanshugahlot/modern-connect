// src/app/calendar/CreateEventButton.tsx
"use client";

import { useState } from "react";

interface Props {
  userId: string;
}

export function CreateEventButton({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: form.get("summary"),
          date: form.get("date"),
          startTime: form.get("startTime"),
          endTime: form.get("endTime"),
          location: form.get("location"),
          description: form.get("description"),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 1500);
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>+</span> New event
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">New event</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="summary"
                required
                placeholder="Event title"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <input
                name="date"
                type="date"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <div className="flex gap-2">
                <input
                  name="startTime"
                  type="time"
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <input
                  name="endTime"
                  type="time"
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <input
                name="location"
                placeholder="Location (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <textarea
                name="description"
                placeholder="Description (optional)"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating..." : status === "success" ? "Created! ✓" : "Create event"}
              </button>
              {status === "error" && (
                <p className="text-xs text-red-500 text-center">Something went wrong. Try again.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}