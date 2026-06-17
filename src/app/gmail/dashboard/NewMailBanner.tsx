//banner componnent 
"use client";

import { useRealtimeUpdates } from "../useRealtimeUpdates";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function NewMailBanner() {
  const event = useRealtimeUpdates();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) setVisible(true);
  }, [event]);

  if (!visible || !event) return null;

  const message = event.type === "new_email" ? "📬 New email received" : "📅 Calendar updated";

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
      <span className="text-sm text-blue-700">{message}</span>
      <button
        onClick={() => {
          router.refresh();
          setVisible(false);
        }}
        className="text-xs text-blue-600 font-medium hover:underline"
      >
        Refresh
      </button>
    </div>
  );
}