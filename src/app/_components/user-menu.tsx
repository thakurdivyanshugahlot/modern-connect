"use client";

import { signOut } from "@/server/lib/auth-client";
import { useRouter } from "next/navigation";

/**
 * Logged-in replacement for the landing page's "Get Started" CTA: shows the
 * user's profile (links into the app) and a sign-out control. Styled with the
 * landing page's design tokens so it matches the existing look.
 */
export function UserMenu({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const display = name || email || "Account";
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <a href="/gmail/dashboard" className="group flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-(--gradient-brand) text-xs font-semibold text-white shadow-(--shadow-glow)">
          {initial}
        </span>
        <span className="hidden max-w-[12rem] truncate text-xs font-medium text-foreground transition-colors group-hover:text-brand sm:inline">
          {display}
        </span>
      </a>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
