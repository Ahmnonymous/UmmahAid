# Health Conditions Multi-Select Migration (Option A: JSONB Array)

This migration changes `Applicant_Details.health` from a single BIGINT (one health condition) to a JSONB array of health condition IDs (multiple health conditions).

## Scripts (run in order)

1. **Pre-migration check** (read-only)  
   `pre_migration_check_health_jsonb.sql`  
   Run first to verify current schema and row counts. Use the sample output to confirm data after migration.

2. **Back up your database**  
   Do this before running the migration.

3. **Migration**  
   `migrate_health_to_jsonb_array.sql`  
   - Adds a temporary JSONB column, migrates existing single `health` values into single-element arrays, drops the old column and FK, renames the new column to `health`, and adds a check constraint.  
   - **Run once only.** Not idempotent.

4. **Rollback** (if needed)  
   `rollback_health_to_single_bigint.sql`  
   Restores a single BIGINT `health` column and FK. Only the first health condition ID is kept; any additional IDs are lost.

## Data handling

- Rows with **non-null** `health` → `health` becomes `[<id>]`.
- Rows with **null** `health` → `health` becomes `[]`.

## After migration

- Backend and frontend already support the new format: API accepts and returns `health` as an array of IDs; reports show comma-separated health condition names where relevant.
