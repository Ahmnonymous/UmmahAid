-- Rollback: Revert Financial_Assistance.Project from ID back to VARCHAR
-- Date: 2026-01-24
-- WARNING: Only use this if you need to revert the migration
-- Make sure you have a backup before running this

BEGIN;

-- ============================================================================
-- STEP 1: Add back the VARCHAR column temporarily
-- ============================================================================
ALTER TABLE Financial_Assistance 
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- ============================================================================
-- STEP 2: Populate the VARCHAR column from Project lookup
-- ============================================================================
UPDATE Financial_Assistance fa
SET project_name = p.Name
FROM Project p
WHERE fa.Project = p.ID
  AND fa.Project IS NOT NULL;

-- ============================================================================
-- STEP 3: Drop the foreign key constraint
-- ============================================================================
ALTER TABLE Financial_Assistance 
DROP CONSTRAINT IF EXISTS fk_financial_assistance_project;

-- ============================================================================
-- STEP 4: Drop the index
-- ============================================================================
DROP INDEX IF EXISTS idx_financial_assistance_project;

-- ============================================================================
-- STEP 5: Drop the ID column
-- ============================================================================
ALTER TABLE Financial_Assistance 
DROP COLUMN IF EXISTS Project;

-- ============================================================================
-- STEP 6: Rename project_name back to Project
-- ============================================================================
ALTER TABLE Financial_Assistance 
RENAME COLUMN project_name TO Project;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    count_with_project INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_with_project 
    FROM Financial_Assistance 
    WHERE Project IS NOT NULL AND Project != '';
    
    RAISE NOTICE 'Rollback complete. Records with Project: %', count_with_project;
END $$;

COMMIT;

-- Note: This rollback does NOT delete the Project lookup table data
-- If you want to clean up the Project table, run:
-- DELETE FROM Project WHERE Created_By = 'SYSTEM_MIGRATION';
