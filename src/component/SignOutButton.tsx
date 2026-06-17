// src/components/SignOutButton.tsx
"use client";

import { signOut } from "@/server/lib/auth-client"; // Import from your local client file
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/"); // Client-side redirect to home
          router.refresh(); // Clears any server-component layouts cache
        },
      },
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-400 hover:text-gray-600"
    >
      Sign out
    </button>
  );
}
