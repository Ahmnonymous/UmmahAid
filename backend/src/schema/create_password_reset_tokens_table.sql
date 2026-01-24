-- Create Password_Reset_Tokens table for UmmahAid
-- This table stores password reset tokens for users

CREATE TABLE IF NOT EXISTS Password_Reset_Tokens (
    ID BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    employee_id BIGINT,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_employee_reset FOREIGN KEY (employee_id) REFERENCES Employee(ID) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON Password_Reset_Tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON Password_Reset_Tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON Password_Reset_Tokens(expires_at);

