// src/server/lib/logger.ts
const isDev = process.env.NODE_ENV === "development";

export const devLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};
