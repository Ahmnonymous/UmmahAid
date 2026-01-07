import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const jsonPath = path.join(__dirname, 'apex', 'COMMENTS_20260103_192202.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Function to escape SQL strings
function escapeSqlString(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\\/g, '\\\\') + "'";
}

// Function to format date from ISO to DATE format
function formatDate(dateStr) {
  if (!dateStr) return 'NULL';
  // Extract date part from ISO format (YYYY-MM-DDTHH:mm:ssZ)
  const dateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return `'${dateMatch[1]}'`;
  }
  return 'NULL';
}

// Generate INSERT statements
let sqlStatements = [];
sqlStatements.push('-- ============================================================');
sqlStatements.push('-- INSERT COMMENTS FROM COMMENTS_20260103_192202.json');
sqlStatements.push('-- Total records: ' + jsonData.items.length);
sqlStatements.push('-- ============================================================\n');

sqlStatements.push('INSERT INTO Comments (File_ID, Comment, Comment_Date, Created_By, Updated_By, Created_At, Updated_At, center_id) VALUES');

const values = jsonData.items.map((item, index) => {
  const fileId = item.file_id || 'NULL';
  const comment = escapeSqlString(item.comments);
  const commentDate = formatDate(item.comment_date);
  const createdBy = escapeSqlString(item.comment_by || 'system');
  const updatedBy = escapeSqlString(item.comment_by || 'system');
  const createdAt = `now()`;
  const updatedAt = `now()`;
  const centerId = 'NULL'; // Default to NULL, can be updated later if needed
  
  const valueLine = `((SELECT ID FROM APPLICANT_DETAILS WHERE FILE_NUMBER = '${fileId}'), ${comment}, ${commentDate}, ${createdBy}, ${updatedBy}, ${createdAt}, ${updatedAt}, ${centerId})`;
  
  // Add comma except for last item
  return valueLine + (index < jsonData.items.length - 1 ? ',' : ';');
});

sqlStatements.push(...values);

sqlStatements.push('\n-- Update sequence for Comments table');
sqlStatements.push("SELECT setval('comments_id_seq', GREATEST(COALESCE((SELECT MAX(ID) FROM Comments), 1), 1));\n");

// Write to output file
const outputPath = path.join(__dirname, 'comments_insert.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8');

console.log(`✅ Successfully converted ${jsonData.items.length} comments to SQL INSERT statements`);
console.log(`📄 Output file: ${outputPath}`);

