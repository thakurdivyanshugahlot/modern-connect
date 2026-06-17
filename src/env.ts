import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    CORSAIR_KEK: z.string().min(1),

    GMAIL_CLIENT_ID: z.string().min(1),
    GMAIL_CLIENT_SECRET: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    GEMINI_API_KEY: z.string().min(1),
    GMAIL_PUBSUB_TOPIC: z.string().min(1),
    WEBHOOK_URL:z.string().min(1),
  },

  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CORSAIR_KEK: process.env.CORSAIR_KEK,

    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GMAIL_PUBSUB_TOPIC:process.env.GMAIL_PUBSUB_TOPIC,
    WEBHOOK_URL:process.env.WEBHOOK_URL
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

