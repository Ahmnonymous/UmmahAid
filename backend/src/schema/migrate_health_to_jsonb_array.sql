-- =============================================================================
-- Migration: Applicant_Details.Health (single BIGINT) -> health (JSONB array)
-- Purpose: Support multiple health conditions per applicant (Option A).
-- Run this script ONLY after backing up your database.
-- =============================================================================

BEGIN;

-- Step 1: Add new JSONB column to hold array of health condition IDs
ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS health_condition_ids JSONB NOT NULL DEFAULT '[]';

-- Step 2: Migrate existing data carefully
-- Convert single health value to single-element array where health is not null
-- (PostgreSQL stores unquoted column names as lowercase, so column is "health")
UPDATE Applicant_Details
SET health_condition_ids = jsonb_build_array(health)
WHERE health IS NOT NULL
  AND (health_condition_ids IS NULL OR health_condition_ids = '[]' OR jsonb_array_length(health_condition_ids) = 0);

-- Ensure rows with NULL health get empty array (idempotent)
UPDATE Applicant_Details
SET health_condition_ids = '[]'
WHERE health IS NULL;

-- Step 3: Drop the foreign key constraint on old health column
ALTER TABLE Applicant_Details
DROP CONSTRAINT IF EXISTS fk_health;

-- Step 4: Drop the old health column (lowercase)
ALTER TABLE Applicant_Details
DROP COLUMN IF EXISTS health;

-- Step 5: Rename new column to health (lowercase for API consistency)
ALTER TABLE Applicant_Details
RENAME COLUMN health_condition_ids TO health;

-- Optional: Add check that health is a JSON array of integers (prevents invalid data)
ALTER TABLE Applicant_Details
ADD CONSTRAINT chk_health_jsonb_array
CHECK (jsonb_typeof(health) = 'array');

COMMIT;

-- =============================================================================
-- Verification (run manually after migration):
--   SELECT id, file_number, health FROM Applicant_Details LIMIT 5;
-- =============================================================================
