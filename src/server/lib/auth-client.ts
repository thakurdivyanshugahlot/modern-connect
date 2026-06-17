// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

// Destructuring for cleaner imports across your components
export const { signOut, useSession ,signIn} = authClient;
