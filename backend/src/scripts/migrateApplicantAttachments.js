/**
 * Migration Script: Fetch Applicant Attachments from Oracle Cloud API
 * 
 * This script:
 * 1. Reads attachment metadata from JSON file
 * 2. Fetches actual file blobs from Oracle Cloud API
 * 3. Inserts/updates records in Attachments table
 * 
 * Usage:
 *   node backend/src/scripts/migrateApplicantAttachments.js [--test] [--limit=N]
 * 
 * Options:
 *   --test    : Test with first attachment only
 *   --limit=N : Process only first N attachments
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'https://gd67d9561edf887-lunaxstudio.adb.af-johannesburg-1.oraclecloudapps.com/ords/sanzaf/sanzafAttachment/applicantpdf';
const JSON_FILE_PATH = path.join(__dirname, '../../../apex/APPLICANT_ATTACHMENT_20260103_191451.json');
const DEFAULT_CENTER_ID = 1; // Default center_id if not found
const DEFAULT_CREATED_BY = 'migration_script';

// Statistics
let stats = {
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Fetch file from Oracle Cloud API
 */
async function fetchAttachmentFromAPI(urlOrId, maxRedirects = 5) {
  if (maxRedirects <= 0) {
    throw new Error('Too many redirects');
  }

  return new Promise((resolve, reject) => {
    // If it's just an ID, construct the full URL
    const url = urlOrId.toString().startsWith('http') 
      ? urlOrId 
      : `${API_BASE_URL}/${urlOrId}`;
    
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Node.js Migration Script'
      },
      timeout: 30000 // 30 seconds timeout
    };

    const req = httpModule.request(options, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          // Handle relative redirects
          const fullRedirectUrl = redirectUrl.startsWith('http') 
            ? redirectUrl 
            : `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
          return fetchAttachmentFromAPI(fullRedirectUrl, maxRedirects - 1).then(resolve).catch(reject);
        }
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'application/octet-stream';
        resolve({ buffer, contentType, size: buffer.length });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Check if attachment already exists in database
 * Note: applicantId is the actual ID from Applicant_Details table
 */
async function attachmentExists(applicantId, attachmentName) {
  try {
    const query = `
      SELECT id FROM Attachments 
      WHERE file_id = $1 
      AND (attachment_name = $2 OR ($2 IS NULL AND attachment_name IS NULL))
      LIMIT 1
    `;
    const result = await pool.query(query, [applicantId, attachmentName]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error(`Error checking attachment existence: ${error.message}`);
    return null;
  }
}

/**
 * Get applicant details by File_Number (file_id in JSON refers to File_Number, not ID)
 */
async function getApplicantByFileNumber(fileNumber) {
  try {
    // Convert to string since File_Number is VARCHAR
    const fileNumberStr = String(fileNumber);
    const query = `SELECT id, center_id, file_number FROM Applicant_Details WHERE file_number = $1 LIMIT 1`;
    const result = await pool.query(query, [fileNumberStr]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`Error looking up applicant by File_Number: ${error.message}`);
    return null;
  }
}

/**
 * Insert or update attachment in database
 */
async function upsertAttachment(attachmentData, fileBuffer, contentType, fileSize) {
  const {
    attach_id,
    file_id, // This is actually the File_Number, not the ID
    attach_name,
    attach_description,
    filename
  } = attachmentData;

  try {
    // Look up applicant by File_Number (file_id in JSON refers to File_Number)
    const applicant = await getApplicantByFileNumber(file_id);
    if (!applicant) {
      throw new Error(`File Number ${file_id} does not exist in Applicant_Details table`);
    }
    
    // Use the actual ID from Applicant_Details for the foreign key
    const applicantId = applicant.id;
    
    // Use center_id from Applicant_Details, fallback to default
    const centerId = applicant.center_id || DEFAULT_CENTER_ID;

    // Check if record exists (using actual applicant ID)
    const existingId = await attachmentExists(applicantId, attach_name);

    if (existingId) {
      // Update existing record
      const updateQuery = `
        UPDATE Attachments 
        SET 
          file = $1,
          file_filename = $2,
          file_mime = $3,
          file_size = $4,
          attachment_details = COALESCE($5, attachment_details),
          updated_by = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING id
      `;
      
      const result = await pool.query(updateQuery, [
        fileBuffer,
        filename,
        contentType,
        fileSize,
        attach_description,
        DEFAULT_CREATED_BY,
        existingId
      ]);

      return { id: result.rows[0].id, action: 'updated' };
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO Attachments (
          file_id,
          attachment_name,
          attachment_details,
          file,
          file_filename,
          file_mime,
          file_size,
          created_by,
          updated_by,
          center_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [
        applicantId, // Use actual ID from Applicant_Details, not File_Number
        attach_name,
        attach_description,
        fileBuffer,
        filename,
        contentType,
        fileSize,
        DEFAULT_CREATED_BY,
        DEFAULT_CREATED_BY,
        centerId
      ]);

      return { id: result.rows[0].id, action: 'inserted' };
    }
  } catch (error) {
    // Check if it's a foreign key constraint error
    if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
      throw new Error(`File Number ${file_id} does not exist in Applicant_Details table`);
    }
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Process a single attachment
 */
async function processAttachment(attachmentData, index, total) {
  const { attach_id, file_id, filename } = attachmentData;
  
  try {
    console.log(`[${index + 1}/${total}] Processing attachment ID ${attach_id} (File Number: ${file_id}, Filename: ${filename})`);

    // Fetch file from API
    const { buffer, contentType, size } = await fetchAttachmentFromAPI(attach_id);
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file received from API');
    }

    // Insert/update in database
    const result = await upsertAttachment(attachmentData, buffer, contentType, size);
    
    stats.success++;
    console.log(`  ✅ ${result.action} successfully (DB ID: ${result.id}, Size: ${(size / 1024).toFixed(2)} KB)`);
    
    return { success: true, attach_id, db_id: result.id };
  } catch (error) {
    stats.failed++;
    const errorMsg = `Failed to process attachment ${attach_id}: ${error.message}`;
    stats.errors.push({ attach_id, file_id, filename, error: error.message });
    console.error(`  ❌ ${errorMsg}`);
    return { success: false, attach_id, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateAttachments(options = {}) {
  const { testMode = false, limit = null } = options;

  try {
    console.log('='.repeat(80));
    console.log('Applicant Attachments Migration Script');
    console.log('='.repeat(80));
    console.log(`JSON File: ${JSON_FILE_PATH}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Test Mode: ${testMode ? 'YES (first attachment only)' : 'NO'}`);
    if (limit) console.log(`Limit: ${limit} attachments`);
    console.log('='.repeat(80));
    console.log('');

    // Read JSON file
    console.log('Reading JSON file...');
    const jsonContent = await fs.readFile(JSON_FILE_PATH, 'utf8');
    const data = JSON.parse(jsonContent);
    const attachments = data.items || [];

    if (attachments.length === 0) {
      console.log('No attachments found in JSON file.');
      return;
    }

    stats.total = attachments.length;
    console.log(`Found ${attachments.length} attachments in JSON file.`);
    console.log('');

    // Determine how many to process
    let attachmentsToProcess = attachments;
    if (testMode) {
      attachmentsToProcess = attachments.slice(0, 1);
      console.log('🧪 TEST MODE: Processing first attachment only');
    } else if (limit) {
      attachmentsToProcess = attachments.slice(0, parseInt(limit));
      console.log(`📊 LIMIT MODE: Processing first ${limit} attachments`);
    }

    console.log(`Processing ${attachmentsToProcess.length} attachment(s)...`);
    console.log('');

    // Process each attachment
    for (let i = 0; i < attachmentsToProcess.length; i++) {
      const attachment = attachmentsToProcess[i];
      stats.processed++;
      
      await processAttachment(attachment, i, attachmentsToProcess.length);
      
      // Small delay to avoid overwhelming the API
      if (i < attachmentsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      }
    }

    // Print summary
    console.log('');
    console.log('='.repeat(80));
    console.log('Migration Summary');
    console.log('='.repeat(80));
    console.log(`Total attachments in JSON: ${stats.total}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`✅ Success: ${stats.success}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log('');

    if (stats.errors.length > 0) {
      console.log('Errors:');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`  - Attachment ${err.attach_id} (File ${err.file_id}): ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log('='.repeat(80));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  testMode: args.includes('--test'),
  limit: args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || null
};

// Run migration
migrateAttachments(options)
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

