import { Redis } from "ioredis";
import { env } from "@/env";

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
  });

redis.on("error", (err) => {
  console.error("[Redis] Client Error:", err);
});

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

/**
 * Checks the user's daily rate limit for AI requests.
 * Counter resets at midnight UTC.
 */
export async function checkRateLimit(userId: string) {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `ratelimit:chat:${userId}:${date}`;
  const LIMIT = 20;

  try {
    const count = await redis.get(key);
    const currentUsage = count ? parseInt(count) : 0;

    return {
      allowed: currentUsage < LIMIT,
      remaining: Math.max(0, LIMIT - currentUsage),
      resetAt: "Midnight UTC",
    };
  } catch (err) {
    console.error("[Redis] Rate limit check failed:", err);
    // Fail-open: allow request if Redis is down
    return {
      allowed: true,
      remaining: -1,
      resetAt: "Unknown",
    };
  }
}

/**
 * Increments the user's daily rate limit counter.
 */
export async function incrementRateLimit(userId: string) {
  const date = new Date().toISOString().split("T")[0];
  const key = `ratelimit:chat:${userId}:${date}`;

  try {
    await redis
      .pipeline()
      .incr(key)
      .expire(key, 60 * 60 * 25)
      .exec();
  } catch (err) {
    console.error("[Redis] Increment failed:", err);
    // Fail-open: nothing to do if increment fails
  }
}
