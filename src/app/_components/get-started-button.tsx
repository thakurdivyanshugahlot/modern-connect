"use client";

import { signIn } from "@/server/lib/auth-client";

/**
 * Landing-page CTA that kicks off the Google OAuth login flow (better-auth
 * social sign-in — the same path SignInButton uses, which the [...all] callback
 * provisions on). Styled purely via `className` so it can drop in wherever the
 * old "Get Started" anchors were.
 */
export function GetStartedButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        signIn.social({ provider: "google", callbackURL: "/gmail/dashboard" })
      }
      className={className}
    >
      {children}
    </button>
  );
}
