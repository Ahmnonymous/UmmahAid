-- ============================================================
-- Per-Participant Message Read Status Tracking
-- ============================================================
-- Purpose: Track read status per participant per message
-- This allows each participant to have their own read status
-- Critical for Announcement conversations where read_status
-- should be tracked individually for each participant
-- Date: 2024

-- Create Message_Read_Status table
CREATE TABLE IF NOT EXISTS Message_Read_Status (
    ID SERIAL PRIMARY KEY,
    Message_ID BIGINT NOT NULL,
    Employee_ID BIGINT NOT NULL,
    Read_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_message_read_status_message FOREIGN KEY (Message_ID) REFERENCES Messages(ID) ON DELETE CASCADE,
    CONSTRAINT fk_message_read_status_employee FOREIGN KEY (Employee_ID) REFERENCES Employee(ID) ON DELETE CASCADE,
    CONSTRAINT uq_message_read_status_unique UNIQUE (Message_ID, Employee_ID)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_message 
ON Message_Read_Status(Message_ID);

CREATE INDEX IF NOT EXISTS idx_message_read_status_employee 
ON Message_Read_Status(Employee_ID);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_employee 
ON Message_Read_Status(Message_ID, Employee_ID);

-- Add comments for documentation
COMMENT ON TABLE Message_Read_Status IS 'Tracks per-participant read status for messages. Each participant can have their own read status independent of others.';
COMMENT ON COLUMN Message_Read_Status.Message_ID IS 'Reference to the message that was read';
COMMENT ON COLUMN Message_Read_Status.Employee_ID IS 'Reference to the employee who read the message';
COMMENT ON COLUMN Message_Read_Status.Read_At IS 'Timestamp when the message was read by this participant';

-- Analyze table for query planner
ANALYZE Message_Read_Status;

