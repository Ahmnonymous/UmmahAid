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

