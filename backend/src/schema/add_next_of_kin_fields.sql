-- Migration: Add Next of Kin fields to Applicant_Details table
-- Date: 2024
-- Description: Adds Next of Kin Name, Surname, Contact Number, and Gender fields

ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(255);

ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS next_of_kin_surname VARCHAR(255);

ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS next_of_kin_contact_number VARCHAR(255);

ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS next_of_kin_gender BIGINT;

-- Add foreign key constraint for next_of_kin_gender if Gender table exists
-- ALTER TABLE Applicant_Details
-- ADD CONSTRAINT fk_next_of_kin_gender FOREIGN KEY (next_of_kin_gender) REFERENCES Gender(ID);

-- Note: These columns allow NULL values as not all applicants may have Next of Kin information
-- The next_of_kin_gender references the Gender lookup table

