//client hook 
"use client";

import { useEffect, useState } from "react";

export function useRealtimeUpdates() {
  const [latestEvent, setLatestEvent] = useState<{ type: string } | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.type !== "connected") {
        setLatestEvent(payload);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return latestEvent;
}