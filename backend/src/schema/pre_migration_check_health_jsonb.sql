-- =============================================================================
-- Pre-migration check: Verify current state before running health JSONB migration
-- Run this BEFORE migrate_health_to_jsonb_array.sql to ensure safe migration.
-- =============================================================================

-- 1. Confirm Applicant_Details has a single health column (BIGINT or similar)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'applicant_details'
  AND column_name IN ('health', 'Health', 'health_condition_ids');

-- 2. Count rows with non-null health (will be migrated to single-element array)
SELECT COUNT(*) AS rows_with_health
FROM applicant_details
WHERE health IS NOT NULL;

-- 3. Count rows with null health (will get empty array [])
SELECT COUNT(*) AS rows_with_null_health
FROM applicant_details
WHERE health IS NULL;

-- 4. Sample of current health values (for verification after migration)
SELECT id, file_number, health
FROM applicant_details
WHERE health IS NOT NULL
LIMIT 5;
