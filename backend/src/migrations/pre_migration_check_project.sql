-- Pre-Migration Check: Financial_Assistance Project Field
-- Run this BEFORE the migration to understand your data
-- Date: 2026-01-24

-- ============================================================================
-- 1. Check current distinct project values in Financial_Assistance
-- ============================================================================
SELECT 'Distinct Projects in Financial_Assistance:' as info;
SELECT DISTINCT Project, COUNT(*) as record_count
FROM Financial_Assistance
WHERE Project IS NOT NULL AND Project != ''
GROUP BY Project
ORDER BY record_count DESC;

-- ============================================================================
-- 2. Check how many records have NULL or empty project
-- ============================================================================
SELECT 'Records with NULL/Empty Project:' as info;
SELECT 
    COUNT(*) as total_null_empty
FROM Financial_Assistance
WHERE Project IS NULL OR Project = '';

-- ============================================================================
-- 3. Check if Project table already has data
-- ============================================================================
SELECT 'Existing Projects in Project table:' as info;
SELECT ID, Name, Created_At 
FROM Project
ORDER BY Name;

-- ============================================================================
-- 4. Check for potential conflicts (projects that already exist)
-- ============================================================================
SELECT 'Potential conflicts (projects already in lookup table):' as info;
SELECT DISTINCT fa.Project as financial_assistance_project, p.Name as existing_project_name, p.ID as existing_project_id
FROM Financial_Assistance fa
JOIN Project p ON LOWER(fa.Project) = LOWER(p.Name)
WHERE fa.Project IS NOT NULL AND fa.Project != '';

-- ============================================================================
-- 5. Check for case sensitivity issues
-- ============================================================================
SELECT 'Case variations in Financial_Assistance.Project:' as info;
SELECT Project, COUNT(*) as count
FROM Financial_Assistance
WHERE Project IS NOT NULL AND Project != ''
GROUP BY Project
HAVING COUNT(*) > 0
ORDER BY LOWER(Project), Project;

-- ============================================================================
-- 6. Total counts summary
-- ============================================================================
SELECT 'Summary:' as info;
SELECT 
    (SELECT COUNT(*) FROM Financial_Assistance) as total_financial_assistance_records,
    (SELECT COUNT(DISTINCT Project) FROM Financial_Assistance WHERE Project IS NOT NULL AND Project != '') as distinct_projects,
    (SELECT COUNT(*) FROM Project) as existing_projects_in_lookup,
    (SELECT COUNT(*) FROM Financial_Assistance WHERE Project IS NOT NULL AND Project != '') as records_with_project;
