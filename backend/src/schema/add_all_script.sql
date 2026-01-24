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

-- Create Email_Templates table for UmmahAid
-- This table stores email templates for various notifications

CREATE TABLE IF NOT EXISTS Email_Templates (
    ID BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_type VARCHAR(100), -- Deprecated: now using email_triggers instead
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    background_image BYTEA,
    background_image_filename VARCHAR(255),
    background_image_mime VARCHAR(255),
    background_image_size INT,
    background_image_updated_at TIMESTAMPTZ,
    background_image_show_link TEXT,
    background_color VARCHAR(50),
    text_color VARCHAR(50),
    button_color VARCHAR(50),
    button_text_color VARCHAR(50),
    image_position VARCHAR(50) DEFAULT 'center', -- 'top', 'center', 'bottom'
    text_alignment VARCHAR(50) DEFAULT 'left', -- 'left', 'center', 'right'
    available_variables TEXT, -- JSON array of available variables like ["{{user_name}}", "{{reset_link}}"]
    recipient_type VARCHAR(50) NOT NULL DEFAULT 'imam', -- 'imam', 'admin', 'both', 'user'
    is_active BOOLEAN NOT NULL DEFAULT true,
    login_url TEXT,
    email_triggers TEXT, -- JSON array of email triggers like [{"table_name": "Jumuah_Khutbah_Topic", "action": "CREATE"}]
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on template_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_template_name ON Email_Templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_template_active ON Email_Templates(is_active);

-- Insert Password Reset Email Template for UmmahAid
-- This template is used when users request a password reset

INSERT INTO Email_Templates (
    template_name,
    subject,
    html_content,
    recipient_type,
    is_active,
    available_variables,
    Created_At,
    Updated_At
) VALUES (
    'Password Reset - User Notification',
    'Password Reset Request - UmmahAid',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f5f5;">
    <div style="width: 70%; max-width: 600px; margin: 20px auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #2d2d2d; font-size: 36px; font-weight: bold; text-align: center; margin-bottom: 20px;">Password Reset</h1>
        <!-- Background Image -->
        <div style="background-color: #BD1F5B; border-radius: 20px; margin-top: 10px; text-align: center; padding: 20px;">
            <img src="{{background_image}}" alt="Password Reset" style="max-width: 70%; height: auto; border-radius: 8px; background: #BD1F5B;" />
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px; text-align: left;">
            Asalaamu Alaikum {{user_name}},
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 15px; text-align: left;">
            You have requested to reset your password for your UmmahAid account.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 15px; text-align: left;">
            Click the button below to reset your password. This link will expire in {{expires_in}}.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{reset_link}}" target="_blank" style="display: inline-block; background-color: #BD1F5B; color: #fff; padding: 15px 60px; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">
                RESET PASSWORD
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px; text-align: left;">
            If you did not request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px; text-align: left;">
            If the button above does not work, you can copy and paste the following link into your browser:
        </p>
        
        <p style="color: #666; font-size: 12px; line-height: 1.6; margin-top: 10px; text-align: left; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            {{reset_link}}
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: left;">
            Kind regards,<br/>
            UmmahAid Team
        </p>
    </div>
</body>
</html>',
    'user',
    true,
    '["{{user_name}}", "{{reset_link}}", "{{expires_in}}", "{{background_image}}"]',
    NOW(),
    NOW()
) ON CONFLICT (template_name) DO UPDATE SET
    subject = EXCLUDED.subject,
    html_content = EXCLUDED.html_content,
    recipient_type = EXCLUDED.recipient_type,
    is_active = EXCLUDED.is_active,
    available_variables = EXCLUDED.available_variables,
    Updated_At = NOW();


