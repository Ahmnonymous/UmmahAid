-- =============================================================================
-- Rollback: health (JSONB array) -> Applicant_Details.Health (single BIGINT)
-- Use only if you need to revert the multi-select health migration.
-- Run ONLY after backing up your database.
-- =============================================================================

BEGIN;

-- Step 1: Add legacy single column with temp name (avoid conflict with existing health)
ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS health_legacy BIGINT;

-- Step 2: Copy first element of health (JSONB) array into health_legacy
UPDATE Applicant_Details
SET health_legacy = (health->>0)::BIGINT
WHERE jsonb_typeof(health) = 'array'
  AND jsonb_array_length(health) > 0
  AND (health->>0) IS NOT NULL
  AND (health->>0) ~ '^\d+$';

-- Step 3: Drop JSONB array constraint if it exists
ALTER TABLE Applicant_Details
DROP CONSTRAINT IF EXISTS chk_health_jsonb_array;

-- Step 4: Drop the health (JSONB) column
ALTER TABLE Applicant_Details
DROP COLUMN IF EXISTS health;

-- Step 5: Rename health_legacy to health
ALTER TABLE Applicant_Details
RENAME COLUMN health_legacy TO health;

-- Step 6: Re-add foreign key
ALTER TABLE Applicant_Details
ADD CONSTRAINT fk_health FOREIGN KEY (health) REFERENCES Health_Conditions(ID);

COMMIT;

-- =============================================================================
-- Note: Applicants who had multiple health conditions selected will retain
-- only the first one after rollback.
-- =============================================================================
