const pool = require('../config/db');

// Map frontend field names to database column names
// PostgreSQL stores unquoted identifiers as lowercase, but we need to use the exact case from schema
// when using quoted identifiers. However, for compatibility, we'll use the schema case.
const mapFieldToColumn = (fieldName) => {
  const fieldMap = {
    'name': 'Name',
    'description': 'Description',
    'created_by': 'Created_By',
    'created_at': 'Created_At',
    'created_on': 'Created_On',
    'updated_by': 'Updated_By',
    'updated_at': 'Updated_At',
    'updated_on': 'Updated_On',
    'hadith_arabic': 'Hadith_Arabic',
    'hadith_english': 'Hadith_English',
  };
  return fieldMap[fieldName] || fieldName;
};

// Map database column names back to frontend field names
// PostgreSQL returns column names - unquoted identifiers become lowercase, but ID might be uppercase
// So we need to handle both cases: 'Name'/'name', 'ID'/'id', 'Created_By'/'created_by', etc.
const mapColumnToField = (columnName) => {
  // Normalize to handle both cases
  const normalized = columnName.toLowerCase();
  
  // Special handling for ID field (can be 'ID' or 'id')
  if (normalized === 'id') {
    return 'id';
  }
  
  const columnMap = {
    'name': 'name',
    'description': 'description',
    'created_by': 'created_by',
    'created_at': 'created_at',
    'created_on': 'created_on',
    'updated_by': 'updated_by',
    'updated_at': 'updated_at',
    'updated_on': 'updated_on',
    'hadith_arabic': 'hadith_arabic',
    'hadith_english': 'hadith_english',
  };
  // Always return lowercase for known fields, or pass through if not in map
  return columnMap[normalized] !== undefined ? columnMap[normalized] : columnName.toLowerCase();
};

const lookupModel = {
  getAll: async (tableName, orderByName = false) => {
    try {
      // PostgreSQL handles case conversion for unquoted identifiers
      const query = `SELECT * FROM ${tableName}${orderByName ? ' ORDER BY Name' : ''}`;
      const res = await pool.query(query);
      // Map column names back to frontend field names
      const mapped = res.rows.map(row => {
        const result = {};
        for (const [key, value] of Object.entries(row)) {
          result[mapColumnToField(key)] = value;
        }
        return result;
      });
      console.log(`[lookupModel.getAll] Table: ${tableName}, Rows: ${mapped.length}, Sample keys:`, mapped[0] ? Object.keys(mapped[0]) : 'none');
      return mapped;
    } catch (err) {
      console.error(`[lookupModel.getAll] Error for table ${tableName}:`, err.message);
      throw err;
    }
  },

  getById: async (tableName, id) => {
    try {
      // Ensure ID is a number
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numericId)) {
        throw new Error(`Invalid ID: ${id}`);
      }
      // Use lowercase 'id' - PostgreSQL stores unquoted identifiers as lowercase
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const res = await pool.query(query, [numericId]);
      if (!res.rows[0]) return null;
      // Map column names back to frontend field names
      const row = res.rows[0];
      const mapped = {};
      for (const [key, value] of Object.entries(row)) {
        mapped[mapColumnToField(key)] = value;
      }
      return mapped;
    } catch (err) {
      console.error(`[lookupModel.getById] Error for table ${tableName}, ID ${id}:`, err.message);
      throw err;
    }
  },

  create: async (tableName, fields) => {
    try {
      // Map frontend field names to database column names
      const mappedFields = {};
      for (const [key, value] of Object.entries(fields)) {
        mappedFields[mapFieldToColumn(key)] = value;
      }
      
      // Don't quote column names - PostgreSQL will handle case conversion for unquoted identifiers
      const columns = Object.keys(mappedFields).join(', ');
      const values = Object.values(mappedFields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      
      console.log(`[lookupModel.create] Table: ${tableName}, Query: ${query}, Values:`, values);
      
      const res = await pool.query(query, values);
      
      // Map column names back to frontend field names
      const row = res.rows[0];
      const mapped = {};
      for (const [key, value] of Object.entries(row)) {
        mapped[mapColumnToField(key)] = value;
      }
      return mapped;
    } catch (err) {
      console.error(`[lookupModel.create] Error for table ${tableName}:`, err.message);
      console.error('Fields received:', fields);
      throw err;
    }
  },

  update: async (tableName, id, fields) => {
    try {
      // Ensure ID is a number
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numericId)) {
        throw new Error(`Invalid ID: ${id}`);
      }
      
      // Map frontend field names to database column names
      const mappedFields = {};
      for (const [key, value] of Object.entries(fields)) {
        // Skip null/undefined values to avoid overwriting with null
        if (value !== null && value !== undefined) {
          mappedFields[mapFieldToColumn(key)] = value;
        }
      }
      
      if (Object.keys(mappedFields).length === 0) {
        throw new Error('No fields to update');
      }
      
      // Don't quote column names - PostgreSQL will handle case conversion for unquoted identifiers
      const setString = Object.keys(mappedFields)
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');
      const values = Object.values(mappedFields);
      // Use lowercase 'id' - PostgreSQL stores unquoted identifiers as lowercase
      const query = `UPDATE ${tableName} SET ${setString} WHERE id = $${values.length + 1} RETURNING *`;
      
      console.log(`[lookupModel.update] Table: ${tableName}, ID: ${numericId} (type: ${typeof numericId}), Query: ${query}`);
      console.log(`[lookupModel.update] Mapped fields:`, mappedFields);
      console.log(`[lookupModel.update] Values:`, values);
      
      const res = await pool.query(query, [...values, numericId]);
      
      console.log(`[lookupModel.update] Query result - rowCount: ${res.rowCount}, hasRows: ${!!res.rows[0]}`);
      
      if (!res.rows[0]) {
        console.warn(`[lookupModel.update] No rows updated for table ${tableName}, ID: ${numericId}`);
        // Try to find the record to see if it exists
        const checkQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
        const checkRes = await pool.query(checkQuery, [numericId]);
        console.log(`[lookupModel.update] Record exists check: ${checkRes.rows.length > 0 ? 'YES' : 'NO'}`);
        return null;
      }
      
      // Map column names back to frontend field names
      const row = res.rows[0];
      const mapped = {};
      for (const [key, value] of Object.entries(row)) {
        mapped[mapColumnToField(key)] = value;
      }
      
      console.log(`[lookupModel.update] Successfully updated record for table ${tableName}, ID: ${numericId}`);
      console.log(`[lookupModel.update] Mapped result:`, mapped);
      return mapped;
    } catch (err) {
      console.error(`[lookupModel.update] Error for table ${tableName}, ID ${id}:`, err.message);
      console.error('Stack:', err.stack);
      console.error('Fields received:', fields);
      throw err;
    }
  },

  delete: async (tableName, id) => {
    try {
      // Ensure ID is a number
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numericId)) {
        throw new Error(`Invalid ID: ${id}`);
      }
      // Use lowercase 'id' - PostgreSQL stores unquoted identifiers as lowercase
      const query = `DELETE FROM ${tableName} WHERE id = $1`;
      const res = await pool.query(query, [numericId]);
      console.log(`[lookupModel.delete] Table: ${tableName}, ID: ${numericId}, Deleted: ${res.rowCount > 0}`);
      return res.rowCount > 0;
    } catch (err) {
      console.error(`[lookupModel.delete] Error for table ${tableName}, ID ${id}:`, err.message);
      throw err;
    }
  }
};

module.exports = lookupModel;
