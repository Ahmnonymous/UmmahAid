const postmark = require('postmark');
const emailTemplateModel = require('../models/emailTemplateModel');
const pool = require('../config/db');

class EmailService {
  constructor() {
    this.client = process.env.POSTMARK_SERVER_TOKEN
      ? new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN)
      : null;
  }

  /**
   * Replace variables in template string
   * Supports both {{variable}} and ((variable)) formats
   */
  replaceVariables(template, variables) {
    let result = template;
    
    // Replace {{variable}} format
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    // Replace ((variable)) format
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\(\\(${key}\\)\\)`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * Get admin email addresses (User_Type = 1 or 7)
   * Also checks for EMAIL_TO environment variable as fallback
   */
  async getAdminEmails() {
    try {
      // First check environment variable
      if (process.env.EMAIL_TO) {
        const envEmails = process.env.EMAIL_TO.split(',').map(e => e.trim()).filter(e => e);
        if (envEmails.length > 0) {
          return envEmails;
        }
      }

      // Then check database
      const query = `
        SELECT e.email 
        FROM Employee e
        WHERE e.user_type IN (1, 7) AND e.email IS NOT NULL AND e.email != ''
      `;
      const res = await pool.query(query);
      const dbEmails = res.rows.map(row => row.email).filter(email => email);
      
      // If no emails in DB, check EMAIL_CC as fallback
      if (dbEmails.length === 0 && process.env.EMAIL_CC) {
        return process.env.EMAIL_CC.split(',').map(e => e.trim()).filter(e => e);
      }
      
      return dbEmails;
    } catch (err) {
      console.error('Error fetching admin emails:', err);
      // Fallback to environment variable
      if (process.env.EMAIL_TO) {
        return process.env.EMAIL_TO.split(',').map(e => e.trim()).filter(e => e);
      }
      return [];
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, userName, resetLink) {
    try {
      if (!this.client) {
        console.error('❌ Postmark client not initialized. Check POSTMARK_SERVER_TOKEN in environment variables.');
        return { success: false, error: 'Email service not configured' };
      }

      const emailFrom = process.env.EMAIL_FROM || 'noreply@ummahaid.org';
      
      // Get password reset email template from database
      let template = await emailTemplateModel.getByName('Password Reset - User Notification');
      
      let subject = 'Password Reset Request';
      let htmlContent = '';
      
      if (template && template.is_active) {
        // Use template from database
        subject = this.replaceVariables(template.subject, { user_name: userName });
        htmlContent = this.replaceVariables(template.html_content, {
          user_name: userName,
          reset_link: resetLink,
          expires_in: '15 minutes'
        });
        
        // Replace login URL if present
        if (template.login_url) {
          htmlContent = htmlContent.replace(/\{\{login_url\}\}/g, template.login_url);
          htmlContent = htmlContent.replace(/\(\(login_url\)\)/g, template.login_url);
        }
        
        // Handle background image
        if (template.background_image_show_link) {
          let imageUrl = template.background_image_show_link;
          // Use environment variable or detect production URL dynamically
          const API_BASE_URL = process.env.API_BASE_URL 
            || process.env.PRODUCTION_API_URL 
            || (process.env.NODE_ENV === 'production' ? 'https://ummahaid.org' : 'http://localhost:5000');
          
          // Always replace any non-production URLs with production URL for email delivery
          const isLocalhost = imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1');
          const isWrongDomain = imageUrl.includes('api.ummahaid.org') || 
                               (imageUrl.includes('ummahaid.org') && !imageUrl.startsWith('https://ummahaid.org'));
          
          if (isLocalhost || isWrongDomain) {
            // Extract the path from the URL
            const urlMatch = imageUrl.match(/https?:\/\/[^\/]+(\/.*)/);
            const urlPath = urlMatch ? urlMatch[1] : '/api/emailTemplates/' + template.id + '/view-image';
            imageUrl = `${API_BASE_URL}${urlPath}`;
            console.log(`📧 Replaced image URL from "${template.background_image_show_link}" to "${imageUrl}"`);
          }
          
          // Ensure the URL is absolute and uses production domain
          if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            if (imageUrl.startsWith('/')) {
              imageUrl = `${API_BASE_URL}${imageUrl}`;
            } else {
              imageUrl = `${API_BASE_URL}/api${imageUrl}`;
            }
          }
          
          // Final check: if URL still contains localhost or wrong domain, force replace
          if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1') || 
              (imageUrl.includes('ummahaid.org') && !imageUrl.startsWith('https://ummahaid.org'))) {
            const urlMatch = imageUrl.match(/https?:\/\/[^\/]+(\/.*)/);
            const urlPath = urlMatch ? urlMatch[1] : '/api/emailTemplates/' + template.id + '/view-image';
            imageUrl = `${API_BASE_URL}${urlPath}`;
            console.log(`📧 Force replaced image URL to production: ${imageUrl}`);
          }
          
          htmlContent = htmlContent.replace(/\{\{background_image\}\}/g, imageUrl);
          htmlContent = htmlContent.replace(/\(\(background_image\)\)/g, imageUrl);
          
          // Also replace any localhost URLs that might be directly embedded in the HTML (safety net)
          htmlContent = htmlContent.replace(
            /https?:\/\/localhost:\d+\/api\/emailTemplates\/(\d+)\/view-image/g,
            `${API_BASE_URL}/api/emailTemplates/$1/view-image`
          );
          htmlContent = htmlContent.replace(
            /https?:\/\/127\.0\.0\.1:\d+\/api\/emailTemplates\/(\d+)\/view-image/g,
            `${API_BASE_URL}/api/emailTemplates/$1/view-image`
          );
        } else if (template.background_image && template.id) {
          // Use environment variable or detect production URL dynamically
          const API_BASE_URL = process.env.API_BASE_URL 
            || process.env.PRODUCTION_API_URL 
            || (process.env.NODE_ENV === 'production' ? 'https://ummahaid.org' : 'http://localhost:5000');
          const imageUrl = `${API_BASE_URL}/api/emailTemplates/${template.id}/view-image`;
          htmlContent = htmlContent.replace(/\{\{background_image\}\}/g, imageUrl);
          htmlContent = htmlContent.replace(/\(\(background_image\)\)/g, imageUrl);
        }
      } else {
        // Fallback: use default template
        subject = 'Password Reset Request - UmmahAid';
        htmlContent = `
          <body style="background-color: #f7f5f5;">
            <div style="width:70%; margin:20px auto;background-color:#fff;padding:20px;border-radius:8px;text-align:center;font-family:Arial,sans-serif;">
              <h1 style="color:#2d2d2d;font-size:36px;font-style:bold;"><b>Password Reset</b></h1>
              <p style="color:#666;font-size:14px;line-height:1.6;margin-top:10px;text-align:left;">
                Asalaamu Alaikum ${userName || 'User'},
              </p>
              <p style="color:#666;font-size:14px;line-height:1.6;margin-top:10px;text-align:left;">
                You have requested to reset your password for your UmmahAid account.
              </p>
              <p style="color:#666;font-size:14px;line-height:1.6;margin-top:10px;text-align:left;">
                Click the button below to reset your password. This link will expire in 15 minutes.
              </p>
              <a href="${resetLink}" target="_blank" style="display:inline-block;background-color:#BD1F5B;color:#fff;padding:15px 60px;text-decoration:none;margin-top:20px;border-radius:5px;font-size:14px;">
                RESET PASSWORD
              </a>
              <p style="color:#666;font-size:14px;line-height:1.6;margin-top:20px;text-align:left;">
                If you did not request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
              <p style="color:#666;font-size:14px;line-height:1.6;margin-top:10px;text-align:left;">
                Kind regards,<br/>
                UmmahAid Team
              </p>
            </div>
          </body>
        `;
      }
      
      const result = await this.client.sendEmail({
        From: emailFrom,
        To: email,
        Subject: subject,
        HtmlBody: htmlContent,
        MessageStream: 'outbound',
      });
      
      console.log(`✅ Password reset email sent successfully to ${email}:`, {
        MessageID: result.MessageID,
        SubmittedAt: result.SubmittedAt,
        To: result.To,
        Subject: result.Subject
      });
      
      return { success: true, result };
    } catch (err) {
      console.error(`❌ Failed to send password reset email to ${email}:`, {
        error: err.message,
        code: err.code,
        statusCode: err.statusCode
      });
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();

