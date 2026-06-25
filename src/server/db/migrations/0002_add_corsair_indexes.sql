CREATE INDEX "idx_corsair_accounts_tenant" ON "corsair_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_corsair_accounts_tenant_integration" ON "corsair_accounts" USING btree ("tenant_id","integration_id");--> statement-breakpoint
CREATE INDEX "idx_corsair_entities_account_type" ON "corsair_entities" USING btree ("account_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_corsair_entities_entity_id" ON "corsair_entities" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_corsair_events_account" ON "corsair_events" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_corsair_integrations_name" ON "corsair_integrations" USING btree ("name");