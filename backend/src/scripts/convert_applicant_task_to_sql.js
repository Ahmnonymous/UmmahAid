import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const jsonPath = path.join(__dirname, '../../../apex/APPLICANT_TASK_20260103_191846.json');
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

// Function to combine task_description and notes
function combineTaskDescription(taskDesc, notes) {
  if (!taskDesc && !notes) return null;
  if (!taskDesc) return notes;
  if (!notes) return taskDesc;
  return `${taskDesc}\n\n${notes}`;
}

// Generate INSERT statements
let sqlStatements = [];
sqlStatements.push('-- ============================================================');
sqlStatements.push('-- INSERT APPLICANT TASKS FROM APPLICANT_TASK_20260103_191846.json');
sqlStatements.push('-- Total records: ' + jsonData.items.length);
sqlStatements.push('-- Generated: ' + new Date().toISOString());
sqlStatements.push('-- ============================================================\n');

sqlStatements.push('INSERT INTO Tasks (File_ID, Task_Description, Date_Required, Status, Created_By, Updated_By, Created_At, Updated_At, center_id) VALUES');

const values = jsonData.items.map((item, index) => {
  const fileNumber = item.file_number || null;
  const taskDescription = combineTaskDescription(item.task_description, item.notes);
  const taskDescEscaped = escapeSqlString(taskDescription);
  const dateRequired = formatDate(item.date_required);
  const status = escapeSqlString('Pending'); // Default status
  const createdBy = escapeSqlString('system');
  const updatedBy = escapeSqlString('system');
  const createdAt = `now()`;
  const updatedAt = `now()`;
  const centerId = 'NULL'; // Default to NULL, can be updated later if needed
  
  // Use subquery to get File_ID from FILE_NUMBER
  const valueLine = `((SELECT ID FROM APPLICANT_DETAILS WHERE FILE_NUMBER = '${fileNumber}'), ${taskDescEscaped}, ${dateRequired}, ${status}, ${createdBy}, ${updatedBy}, ${createdAt}, ${updatedAt}, ${centerId})`;
  
  // Add comma except for last item
  return valueLine + (index < jsonData.items.length - 1 ? ',' : ';');
});

sqlStatements.push(...values);

sqlStatements.push('\n-- Update sequence for Tasks table');
sqlStatements.push("SELECT setval('tasks_id_seq', GREATEST(COALESCE((SELECT MAX(ID) FROM Tasks), 1), 1));\n");

// Write to output file
const outputPath = path.join(__dirname, '../schema/applicant_task_insert.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8');

console.log(`✅ Successfully converted ${jsonData.items.length} applicant tasks to SQL INSERT statements`);
console.log(`📄 Output file: ${outputPath}`);

// Validation summary
const stats = {
  total: jsonData.items.length,
  withFileNumber: jsonData.items.filter(item => item.file_number).length,
  withTaskDescription: jsonData.items.filter(item => item.task_description).length,
  withNotes: jsonData.items.filter(item => item.notes).length,
  withDateRequired: jsonData.items.filter(item => item.date_required).length,
  withBothDescriptionAndNotes: jsonData.items.filter(item => item.task_description && item.notes).length
};

console.log('\n📊 Conversion Statistics:');
console.log(`   Total records: ${stats.total}`);
console.log(`   Records with file_number: ${stats.withFileNumber}`);
console.log(`   Records with task_description: ${stats.withTaskDescription}`);
console.log(`   Records with notes: ${stats.withNotes}`);
console.log(`   Records with both description and notes: ${stats.withBothDescriptionAndNotes}`);
console.log(`   Records with date_required: ${stats.withDateRequired}`);

