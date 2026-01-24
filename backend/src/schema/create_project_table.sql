-- Create Project lookup table
-- This table stores project information with a description field
-- Run this script to create the Project table if it doesn't exist

CREATE TABLE IF NOT EXISTS Project (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_project_name ON Project(Name);

-- Add comments for documentation
COMMENT ON TABLE Project IS 'Lookup table for projects with descriptions';
COMMENT ON COLUMN Project.ID IS 'Primary key';
COMMENT ON COLUMN Project.Name IS 'Project name (unique)';
COMMENT ON COLUMN Project.Description IS 'Project description';
COMMENT ON COLUMN Project.Created_By IS 'User who created the record';
COMMENT ON COLUMN Project.Created_At IS 'Timestamp when record was created';
COMMENT ON COLUMN Project.Updated_By IS 'User who last updated the record';
COMMENT ON COLUMN Project.Updated_At IS 'Timestamp when record was last updated';
