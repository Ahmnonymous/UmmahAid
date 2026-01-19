-- Migration: Add muslim_name column to Applicant_Details table
-- Date: 2024
-- Description: Adds muslim_name field to store the applicant's Muslim name

ALTER TABLE Applicant_Details
ADD COLUMN IF NOT EXISTS muslim_name VARCHAR(255);

-- Note: This column allows NULL values as not all applicants may have a Muslim name
-- The column is added after the Surname column in the logical field order

