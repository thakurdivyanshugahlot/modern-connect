import { db } from "./index";
import { corsairEntities, corsairAccounts } from "./schema";
import { eq, and } from "drizzle-orm";

export async function getGmailMessages(tenantId: string) {
  const account = await db.query.corsairAccounts.findFirst({
    where: and(
      eq(corsairAccounts.tenantId, tenantId),
      eq(corsairAccounts.status, "active")
    ),
  });

  if (!account) return [];

  return db.query.corsairEntities.findMany({
    where: and(
      eq(corsairEntities.accountId, account.id),
      eq(corsairEntities.type, "email")
    ),
    orderBy: (entities, { desc }) => [desc(entities.createdAt)],
  });
}

export async function getCalendarEvents(tenantId: string) {
  const account = await db.query.corsairAccounts.findFirst({
    where: and(
      eq(corsairAccounts.tenantId, tenantId),
      eq(corsairAccounts.status, "active")
    ),
  });

  if (!account) return [];

  return db.query.corsairEntities.findMany({
    where: and(
      eq(corsairEntities.accountId, account.id),
      eq(corsairEntities.type, "event")
    ),
    orderBy: (entities, { desc }) => [desc(entities.createdAt)],
  });
}
