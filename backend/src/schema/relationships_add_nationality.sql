-- ============================================================
-- Add Nationality, Passport Expiry Date, and Passport Number
-- to Relationships Table
-- ============================================================
-- Description: Adds nationality field and passport-related fields
--              to the Relationships table for tracking relationship
--              members' nationality and passport information.
-- ============================================================

-- Add Nationality column (foreign key to Nationality table)
-- Using lowercase to match existing column naming pattern (date_of_birth, id_number, etc.)
ALTER TABLE Relationships
ADD COLUMN IF NOT EXISTS nationality BIGINT;

-- Add foreign key constraint for Nationality
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_nationality_rel'
    ) THEN
        ALTER TABLE Relationships
        ADD CONSTRAINT fk_nationality_rel 
        FOREIGN KEY (nationality) REFERENCES "Nationality"("ID");
    END IF;
END $$;

-- Add Passport Expiry Date column
ALTER TABLE Relationships
ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;

-- Add Passport Number column
ALTER TABLE Relationships
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN Relationships.nationality IS 'Foreign key reference to Nationality table';
COMMENT ON COLUMN Relationships.passport_expiry_date IS 'Passport expiry date (required if nationality is not South African)';
COMMENT ON COLUMN Relationships.passport_number IS 'Passport number (required if nationality is not South African)';

