const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

// PostgreSQL stores unquoted identifiers as lowercase
// Use lowercase to match how the table is actually stored
const tableName = "financial_assessment";

const financialAssessmentModel = {
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(`SELECT * FROM ${tableName}`, {
        centerId,
        isSuperAdmin: isMultiCenter,
        column: "center_id",
        enforce: !!centerId && !isMultiCenter,
      });

      const res = await pool.query(scoped.text, scoped.values);
      return res.rows;
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(
        {
          text: `SELECT * FROM ${tableName} WHERE "id" = $1`,
          values: [id],
        },
        {
          centerId,
          isSuperAdmin: isMultiCenter,
          column: "center_id",
          enforce: !!centerId && !isMultiCenter,
        },
      );

      const res = await pool.query(scoped.text, scoped.values);
      if (!res.rows[0]) return null;

      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error fetching record by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  getByFileId: async (fileId, centerId = null, isMultiCenter = false) => {
    try {
      // PostgreSQL stores unquoted identifiers as lowercase, so File_ID becomes file_id
      const baseQuery = {
        text: `SELECT * FROM ${tableName} WHERE file_id = $1 ORDER BY created_at DESC LIMIT 1`,
        values: [fileId],
      };
      
      const scoped = scopeQuery(
        baseQuery,
        {
          centerId,
          isSuperAdmin: isMultiCenter,
          column: "center_id",
          enforce: !!centerId && !isMultiCenter,
        },
      );

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('getByFileId query:', scoped.text);
        console.log('getByFileId values:', scoped.values);
      }

      const res = await pool.query(scoped.text, scoped.values);
      
      if (!res.rows[0]) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No financial assessment found for file_id:', fileId);
        }
        return null;
      }

      const result = res.rows[0];
      
      // Verify the result matches the requested file_id
      if (result.file_id && parseInt(result.file_id, 10) !== parseInt(fileId, 10)) {
        console.error('Query returned wrong file_id:', {
          requested: fileId,
          returned: result.file_id
        });
        return null;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('getByFileId result:', { id: result.id, file_id: result.file_id });
      }

      return result;
    } catch (err) {
      console.error('getByFileId error:', err);
      throw new Error(
        `Error fetching record by file_id from ${tableName}: ${err.message}`,
      );
    }
  },

  create: async (fields) => {
    try {
      const { columns, values, placeholders } = buildInsertFragments(fields);
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    const existing = await financialAssessmentModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
    if (!existing) {
      return null;
    }

    try {
      const { setClause, values } = buildUpdateFragments(fields);
      const query = `UPDATE ${tableName} SET ${setClause} WHERE "id" = $${
        values.length + 1
      } RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    const existing = await financialAssessmentModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
    if (!existing) {
      return null;
    }

    try {
      const query = `DELETE FROM ${tableName} WHERE "id" = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = financialAssessmentModel;
