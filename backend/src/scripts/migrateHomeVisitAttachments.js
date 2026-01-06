/**
 * Migration Script: Fetch Home Visit Attachments from Oracle Cloud API
 * 
 * This script:
 * 1. Reads home visit metadata from JSON file
 * 2. Fetches actual file blobs from Oracle Cloud API
 * 3. Updates records in Home_Visit table with attachment data
 * 
 * Usage:
 *   node backend/src/scripts/migrateHomeVisitAttachments.js [--test] [--limit=N]
 * 
 * Options:
 *   --test    : Test with first home visit only
 *   --limit=N : Process only first N home visits
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'https://gd67d9561edf887-lunaxstudio.adb.af-johannesburg-1.oraclecloudapps.com/ords/sanzaf/sanzafAttachment/applicant_home_visit_pdf';
const JSON_FILE_PATH = path.join(__dirname, '../../../apex/APPLICANT_HOME_VISIT_20260103_191538.json');
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
 * Find Home_Visit record by applicant ID and visit date
 */
async function findHomeVisit(applicantId, visitDate) {
  try {
    // Parse visit date and format for comparison
    const visitDateObj = new Date(visitDate);
    const visitDateStr = visitDateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
      SELECT id, attachment_1, attachment_2 
      FROM Home_Visit 
      WHERE file_id = $1 
      AND visit_date::date = $2::date
      ORDER BY id DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [applicantId, visitDateStr]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`Error finding home visit: ${error.message}`);
    return null;
  }
}

/**
 * Update home visit with attachment
 */
async function updateHomeVisitAttachment(homeVisitId, fileBuffer, contentType, fileSize, filename) {
  try {
    // Check which attachment slot to use (prefer Attachment_1, use Attachment_2 if Attachment_1 exists)
    const checkQuery = `SELECT attachment_1 FROM Home_Visit WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [homeVisitId]);
    const hasAttachment1 = checkResult.rows[0]?.attachment_1;

    let updateQuery;
    if (!hasAttachment1) {
      // Use Attachment_1
      updateQuery = `
        UPDATE Home_Visit 
        SET 
          attachment_1 = $1,
          attachment_1_filename = $2,
          attachment_1_mime = $3,
          attachment_1_size = $4,
          updated_by = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING id
      `;
    } else {
      // Use Attachment_2
      updateQuery = `
        UPDATE Home_Visit 
        SET 
          attachment_2 = $1,
          attachment_2_filename = $2,
          attachment_2_mime = $3,
          attachment_2_size = $4,
          updated_by = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING id
      `;
    }

    const result = await pool.query(updateQuery, [
      fileBuffer,
      filename,
      contentType,
      fileSize,
      DEFAULT_CREATED_BY,
      homeVisitId
    ]);

    return { 
      id: result.rows[0].id, 
      action: 'updated',
      attachmentSlot: hasAttachment1 ? 'attachment_2' : 'attachment_1'
    };
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Process a single home visit
 */
async function processHomeVisit(homeVisitData, index, total) {
  const { visit_id, file_id, visit_date, filename } = homeVisitData;
  
  try {
    // Skip if no filename (no attachment expected)
    if (!filename) {
      stats.skipped++;
      console.log(`[${index + 1}/${total}] Skipping visit ID ${visit_id} (File Number: ${file_id}) - no filename`);
      return { success: true, visit_id, skipped: true };
    }

    console.log(`[${index + 1}/${total}] Processing visit ID ${visit_id} (File Number: ${file_id}, Filename: ${filename})`);

    // Look up applicant by File_Number
    const applicant = await getApplicantByFileNumber(file_id);
    if (!applicant) {
      throw new Error(`File Number ${file_id} does not exist in Applicant_Details table`);
    }

    // Find home visit record
    const homeVisit = await findHomeVisit(applicant.id, visit_date);
    if (!homeVisit) {
      throw new Error(`Home visit not found for File Number ${file_id} on date ${visit_date}`);
    }

    // Fetch file from API
    const { buffer, contentType, size } = await fetchAttachmentFromAPI(visit_id);
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file received from API');
    }

    // Use filename from JSON or from API response
    const finalFilename = filename || `home_visit_${visit_id}.pdf`;

    // Update home visit with attachment
    const result = await updateHomeVisitAttachment(
      homeVisit.id,
      buffer,
      contentType || homeVisitData.mimetype || 'application/pdf',
      size,
      finalFilename
    );
    
    stats.success++;
    console.log(`  ✅ Updated successfully (DB ID: ${homeVisit.id}, Slot: ${result.attachmentSlot}, Size: ${(size / 1024).toFixed(2)} KB)`);
    
    return { success: true, visit_id, db_id: homeVisit.id, attachmentSlot: result.attachmentSlot };
  } catch (error) {
    stats.failed++;
    const errorMsg = `Failed to process visit ${visit_id}: ${error.message}`;
    stats.errors.push({ visit_id, file_id, visit_date, filename, error: error.message });
    console.error(`  ❌ ${errorMsg}`);
    return { success: false, visit_id, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateHomeVisitAttachments(options = {}) {
  const { testMode = false, limit = null } = options;

  try {
    console.log('='.repeat(80));
    console.log('Home Visit Attachments Migration Script');
    console.log('='.repeat(80));
    console.log(`JSON File: ${JSON_FILE_PATH}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Test Mode: ${testMode ? 'YES (first home visit only)' : 'NO'}`);
    if (limit) console.log(`Limit: ${limit} home visits`);
    console.log('='.repeat(80));
    console.log('');

    // Read JSON file
    console.log('Reading JSON file...');
    const jsonContent = await fs.readFile(JSON_FILE_PATH, 'utf8');
    const data = JSON.parse(jsonContent);
    const homeVisits = data.items || [];

    if (homeVisits.length === 0) {
      console.log('No home visits found in JSON file.');
      return;
    }

    stats.total = homeVisits.length;
    console.log(`Found ${homeVisits.length} home visits in JSON file.`);
    console.log('');

    // Filter home visits that have filenames (attachments)
    const homeVisitsWithAttachments = homeVisits.filter(hv => hv.filename);
    console.log(`Found ${homeVisitsWithAttachments.length} home visits with attachments.`);
    console.log('');

    // Determine how many to process
    let visitsToProcess = homeVisitsWithAttachments;
    if (testMode) {
      visitsToProcess = homeVisitsWithAttachments.slice(0, 1);
      console.log('🧪 TEST MODE: Processing first home visit with attachment only');
    } else if (limit) {
      visitsToProcess = homeVisitsWithAttachments.slice(0, parseInt(limit));
      console.log(`📊 LIMIT MODE: Processing first ${limit} home visits with attachments`);
    }

    console.log(`Processing ${visitsToProcess.length} home visit(s)...`);
    console.log('');

    // Process each home visit
    for (let i = 0; i < visitsToProcess.length; i++) {
      const homeVisit = visitsToProcess[i];
      stats.processed++;
      
      await processHomeVisit(homeVisit, i, visitsToProcess.length);
      
      // Small delay to avoid overwhelming the API
      if (i < visitsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      }
    }

    // Print summary
    console.log('');
    console.log('='.repeat(80));
    console.log('Migration Summary');
    console.log('='.repeat(80));
    console.log(`Total home visits in JSON: ${stats.total}`);
    console.log(`Home visits with attachments: ${homeVisitsWithAttachments.length}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`✅ Success: ${stats.success}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log('');

    if (stats.errors.length > 0) {
      console.log('Errors:');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`  - Visit ${err.visit_id} (File ${err.file_id}, Date: ${err.visit_date}): ${err.error}`);
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
migrateHomeVisitAttachments(options)
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

