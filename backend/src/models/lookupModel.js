const pool = require('../config/db');

// Map frontend field names to database column names
// PostgreSQL stores unquoted identifiers as lowercase, but we need to use the exact case from schema
// when using quoted identifiers. However, for compatibility, we'll use the schema case.
const mapFieldToColumn = (fieldName) => {
  const fieldMap = {
    'name': 'Name',
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
    const query = `SELECT * FROM ${tableName} WHERE ID = $1`;
    const res = await pool.query(query, [id]);
    if (!res.rows[0]) return null;
    // Map column names back to frontend field names
    const row = res.rows[0];
    const mapped = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[mapColumnToField(key)] = value;
    }
    return mapped;
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
    // Map frontend field names to database column names
    const mappedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      mappedFields[mapFieldToColumn(key)] = value;
    }
    
    // Don't quote column names - PostgreSQL will handle case conversion for unquoted identifiers
    const setString = Object.keys(mappedFields)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(mappedFields);
    const query = `UPDATE ${tableName} SET ${setString} WHERE ID = $${values.length + 1} RETURNING *`;
    const res = await pool.query(query, [...values, id]);
    
    if (!res.rows[0]) return null;
    
    // Map column names back to frontend field names
    const row = res.rows[0];
    const mapped = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[mapColumnToField(key)] = value;
    }
    return mapped;
  },

  delete: async (tableName, id) => {
    const query = `DELETE FROM ${tableName} WHERE ID = $1`;
    const res = await pool.query(query, [id]);
    return res.rowCount > 0;
  }
};

module.exports = lookupModel;
