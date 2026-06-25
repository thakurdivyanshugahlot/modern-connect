"use client";

import { useState, useEffect } from "react";

/**
 * Returns the user's IANA timezone (e.g. "America/New_York").
 *
 * SSR/first render returns the "Asia/Kolkata" fallback so the server HTML and
 * the client's first render match (no hydration mismatch). The effect then
 * swaps in the real local timezone. Pair with `suppressHydrationWarning` on the
 * rendered date/time nodes so the post-effect correction never trips React #418.
 */
export function useTimezone() {
  const [timezone, setTimezone] = useState("Asia/Kolkata"); // IST fallback

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return timezone;
}
