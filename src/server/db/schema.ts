import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';


export * from "./auth-schema";

export const corsairIntegrations = pgTable('corsair_integrations', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
}, (t) => [
    // Integrations are looked up by name on every requireSession / dashboard / cron pass.
    index('idx_corsair_integrations_name').on(t.name),
]);

export const corsairAccounts = pgTable('corsair_accounts', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    tenantId: text('tenant_id').notNull(),
    integrationId: text('integration_id').notNull().references(() => corsairIntegrations.id),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
}, (t) => [
    // Hot path: account lookups by tenant, and by (tenant, integration) in
    // requireSession/ensureCorsairAccount and the dashboard guard.
    index('idx_corsair_accounts_tenant').on(t.tenantId),
    index('idx_corsair_accounts_tenant_integration').on(t.tenantId, t.integrationId),
]);

export const corsairEntities = pgTable('corsair_entities', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    version: text('version').notNull(),
    data: jsonb('data').notNull().default({}),
}, (t) => [
    // Every gmail/calendar db.list filters by account_id (+ entity_type);
    // entity_id is used for upsert-by-entity lookups.
    index('idx_corsair_entities_account_type').on(t.accountId, t.entityType),
    index('idx_corsair_entities_entity_id').on(t.entityId),
]);

export const corsairEvents = pgTable('corsair_events', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    status: text('status'),
}, (t) => [
    index('idx_corsair_events_account').on(t.accountId),
]);