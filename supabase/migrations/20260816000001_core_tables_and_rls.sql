-- ============================================================
-- Migration: 20260816000001_core_tables_and_rls
-- Purpose: Create organizations and audit_log tables with RLS
-- ============================================================

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "legal_name" TEXT,
    "registration_number" TEXT,
    "country_code" TEXT NOT NULL DEFAULT 'BD',
    "currency_code" TEXT NOT NULL DEFAULT 'BDT',
    "settings" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;

-- 2. Audit log table (tamper-evident, hash-chained)
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "prev_hash" TEXT,
    "row_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit_log
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_audit_log_org_created" ON "audit_log"("org_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_log_entity" ON "audit_log"("org_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_log_user" ON "audit_log"("org_id", "user_id", "created_at" DESC);

-- RLS Policies
CREATE POLICY "audit_log_tenant_isolation" ON "audit_log"
    FOR SELECT
    USING (org_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);
