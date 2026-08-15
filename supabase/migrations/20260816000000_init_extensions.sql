-- ============================================================
-- Migration: 00000000000000_init_extensions
-- Purpose: Enable required PostgreSQL extensions
-- Author: JAAGO ERP System
-- ============================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto for gen_random_bytes used in encryption helpers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- pg_trgm for trigram-based text search on entity fields (employees, vendors, etc.)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- unaccent for search normalization (Bangla name searches)
CREATE EXTENSION IF NOT EXISTS "unaccent";
