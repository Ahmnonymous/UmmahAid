/**
 * Script to upload ForgotPassword.png image to the Password Reset email template
 * Run this script after creating the email template in the database
 * 
 * Usage: node src/scripts/upload_forgot_password_image.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function uploadForgotPasswordImage() {
  try {
    console.log('📸 Starting Forgot Password image upload...');

    // Path to the image file (relative to backend/src/scripts directory)
    // Script is in: backend/src/scripts/
    // Image is in: src/assets/images/ (project root)
    const imagePath = path.join(__dirname, '../../../src/assets/images/ForgotPassword.png');
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at: ${imagePath}`);
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const imageStats = fs.statSync(imagePath);
    
    console.log(`✅ Image file found: ${imagePath}`);
    console.log(`   Size: ${imageStats.size} bytes`);

    // Find the Password Reset template
    const templateQuery = `SELECT id FROM Email_Templates WHERE template_name = 'Password Reset - User Notification'`;
    const templateResult = await pool.query(templateQuery);
    
    if (templateResult.rows.length === 0) {
      throw new Error('Password Reset email template not found. Please run insert_password_reset_email_template.sql first.');
    }

    const templateId = templateResult.rows[0].id;
    console.log(`✅ Found email template with ID: ${templateId}`);

    // Determine API base URL for the show_link
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
      ? (process.env.API_BASE_URL || process.env.PRODUCTION_API_URL || 'https://ummahaid.org')
      : (process.env.API_BASE_URL || 'http://localhost:5000');
    
    const showLink = `${API_BASE_URL}/api/emailTemplates/${templateId}/view-image`;

    // Update the template with the image
    const updateQuery = `
      UPDATE Email_Templates 
      SET 
        background_image = $1,
        background_image_filename = $2,
        background_image_mime = $3,
        background_image_size = $4,
        background_image_updated_at = NOW(),
        background_image_show_link = $5,
        Updated_At = NOW()
      WHERE id = $6
      RETURNING id, template_name, background_image_filename, background_image_show_link
    `;

    const updateResult = await pool.query(updateQuery, [
      imageBuffer,
      'ForgotPassword.png',
      'image/png',
      imageStats.size,
      showLink,
      templateId
    ]);

    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update email template');
    }

    console.log('✅ Successfully uploaded Forgot Password image to email template!');
    console.log(`   Template ID: ${updateResult.rows[0].id}`);
    console.log(`   Template Name: ${updateResult.rows[0].template_name}`);
    console.log(`   Image Filename: ${updateResult.rows[0].background_image_filename}`);
    console.log(`   Image URL: ${updateResult.rows[0].background_image_show_link}`);
    console.log('\n📧 The background image will now be used in password reset emails!');

  } catch (error) {
    console.error('❌ Error uploading image:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
uploadForgotPasswordImage();

