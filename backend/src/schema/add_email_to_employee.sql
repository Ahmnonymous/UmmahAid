-- Add email column to Employee table for UmmahAid
-- This script adds the email column if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Employee' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE Employee ADD COLUMN email VARCHAR(255);
        
        -- Create index on email for faster lookups
        CREATE INDEX IF NOT EXISTS idx_employee_email ON Employee(email);
        
        RAISE NOTICE 'Email column added to Employee table';
    ELSE
        RAISE NOTICE 'Email column already exists in Employee table';
    END IF;
END $$;

