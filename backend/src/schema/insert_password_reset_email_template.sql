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
            For security reasons, this link will expire in 15 minutes. If you need to reset your password again, please request a new reset link. 
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

