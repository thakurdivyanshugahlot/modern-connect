import { db } from "./index";
import { corsairEntities, corsairAccounts } from "./schema";
import { eq, and } from "drizzle-orm";

export async function getGmailMessages(tenantId: string) {
  const account = await db.query.corsairAccounts.findFirst({
    where: eq(corsairAccounts.tenantId, tenantId),
  });

  if (!account) return [];

  return db.query.corsairEntities.findMany({
    where: and(
      eq(corsairEntities.accountId, account.id),
      eq(corsairEntities.entityType, "email")
    ),
    orderBy: (entities, { desc }) => [desc(entities.createdAt)],
  });
}

export async function getCalendarEvents(tenantId: string) {
  const account = await db.query.corsairAccounts.findFirst({
    where: eq(corsairAccounts.tenantId, tenantId),
  });

  if (!account) return [];

  return db.query.corsairEntities.findMany({
    where: and(
      eq(corsairEntities.accountId, account.id),
      eq(corsairEntities.entityType, "event")
    ),
    orderBy: (entities, { desc }) => [desc(entities.createdAt)],
  });
}
