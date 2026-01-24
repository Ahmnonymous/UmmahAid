-- Migration: Convert Financial_Assistance.Project from VARCHAR to Project ID lookup
-- Date: 2026-01-24
-- Description: Migrates project data from text field to lookup table reference
-- 
-- IMPORTANT: Run this in a transaction in production
-- Before running, take a backup of Financial_Assistance table

BEGIN;

-- ============================================================================
-- STEP 1: Verify the Project table exists (create if not)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Project (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 2: Insert unique project names from Financial_Assistance into Project table
-- Only inserts projects that don't already exist in the Project table
-- ============================================================================
INSERT INTO Project (Name, Description, Created_By, Created_At)
SELECT DISTINCT 
    fa.Project,
    'Migrated from Financial_Assistance table',
    'SYSTEM_MIGRATION',
    now()
FROM Financial_Assistance fa
WHERE fa.Project IS NOT NULL 
  AND fa.Project != ''
  AND NOT EXISTS (
      SELECT 1 FROM Project p WHERE LOWER(p.Name) = LOWER(fa.Project)
  );

-- Show what was inserted (for verification)
DO $$
DECLARE
    inserted_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inserted_count 
    FROM Project 
    WHERE Created_By = 'SYSTEM_MIGRATION';
    
    RAISE NOTICE 'Inserted % new projects into Project table', inserted_count;
END $$;

-- ============================================================================
-- STEP 3: Add new project_id column to Financial_Assistance
-- ============================================================================
ALTER TABLE Financial_Assistance 
ADD COLUMN IF NOT EXISTS project_id BIGINT;

-- ============================================================================
-- STEP 4: Populate project_id with corresponding Project IDs
-- Uses case-insensitive matching to handle any case differences
-- ============================================================================
UPDATE Financial_Assistance fa
SET project_id = p.ID
FROM Project p
WHERE LOWER(fa.Project) = LOWER(p.Name)
  AND fa.Project IS NOT NULL
  AND fa.Project != '';

-- Show update statistics
DO $$
DECLARE
    updated_count INTEGER;
    null_project_count INTEGER;
    unmatched_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM Financial_Assistance 
    WHERE project_id IS NOT NULL;
    
    SELECT COUNT(*) INTO null_project_count 
    FROM Financial_Assistance 
    WHERE Project IS NULL OR Project = '';
    
    SELECT COUNT(*) INTO unmatched_count 
    FROM Financial_Assistance 
    WHERE project_id IS NULL AND Project IS NOT NULL AND Project != '';
    
    RAISE NOTICE 'Updated % records with project_id', updated_count;
    RAISE NOTICE 'Records with NULL/empty project: %', null_project_count;
    RAISE NOTICE 'Unmatched records (should be 0): %', unmatched_count;
END $$;

-- ============================================================================
-- STEP 5: Verify migration - Check for any unmatched records
-- This should return 0 rows if migration is successful
-- ============================================================================
DO $$
DECLARE
    unmatched_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmatched_count
    FROM Financial_Assistance
    WHERE Project IS NOT NULL 
      AND Project != ''
      AND project_id IS NULL;
    
    IF unmatched_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % records have Project value but no matching project_id', unmatched_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Drop the old Project VARCHAR column
-- ============================================================================
ALTER TABLE Financial_Assistance 
DROP COLUMN IF EXISTS Project;

-- ============================================================================
-- STEP 7: Rename project_id to Project (optional - keeps same column name)
-- Comment this out if you want to keep the column name as project_id
-- ============================================================================
ALTER TABLE Financial_Assistance 
RENAME COLUMN project_id TO Project;

-- ============================================================================
-- STEP 8: Add foreign key constraint
-- ============================================================================
ALTER TABLE Financial_Assistance 
ADD CONSTRAINT fk_financial_assistance_project 
FOREIGN KEY (Project) REFERENCES Project(ID);

-- ============================================================================
-- STEP 9: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_financial_assistance_project 
ON Financial_Assistance(Project);

-- ============================================================================
-- Final verification
-- ============================================================================
DO $$
DECLARE
    fa_count INTEGER;
    proj_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fa_count FROM Financial_Assistance WHERE Project IS NOT NULL;
    SELECT COUNT(*) INTO proj_count FROM Project;
    
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'Financial_Assistance records with Project: %', fa_count;
    RAISE NOTICE 'Total Projects in lookup table: %', proj_count;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to verify)
-- ============================================================================
-- Check the new structure:
-- \d Financial_Assistance

-- View project distribution:
-- SELECT p.Name, COUNT(fa.ID) as assistance_count
-- FROM Financial_Assistance fa
-- JOIN Project p ON fa.Project = p.ID
-- GROUP BY p.Name
-- ORDER BY assistance_count DESC;

-- View all projects:
-- SELECT * FROM Project ORDER BY Name;
