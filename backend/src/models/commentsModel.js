const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Comments";

const commentsModel = {
  getAll: async (centerId = null, isMultiCenter = false, fileId = null) => {
    try {
      let baseQuery = `SELECT * FROM ${tableName}`;
      const conditions = [];
      const values = [];

      // Filter by file_id if provided (for applicant detail views)
      if (fileId !== null && fileId !== undefined) {
        // PostgreSQL stores unquoted identifiers as lowercase, so File_ID becomes file_id
        conditions.push(`file_id = $${values.length + 1}`);
        values.push(fileId);
      }

      // When filtering by file_id (viewing specific applicant), be more lenient with center_id
      // Include comments with center_id = null for backward compatibility with old comments
      const shouldEnforceCenterFilter = !!centerId && !isMultiCenter;
      const isFileSpecificView = fileId !== null && fileId !== undefined;
      
      if (shouldEnforceCenterFilter && isFileSpecificView) {
        // For file-specific views, include comments with center_id = null OR center_id = user's center_id
        // This ensures old comments without center_id are still visible
        conditions.push(`(center_id IS NULL OR center_id = $${values.length + 1})`);
        values.push(centerId);
      }

      // Build WHERE clause if we have conditions
      if (conditions.length > 0) {
        baseQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      // For general views (not file-specific), use standard center filtering
      if (!isFileSpecificView) {
        const scoped = scopeQuery(
          conditions.length > 0
            ? { text: baseQuery, values }
            : baseQuery,
          {
            centerId,
            isSuperAdmin: isMultiCenter,
            column: "center_id",
            enforce: shouldEnforceCenterFilter,
          },
        );
        baseQuery = scoped.text;
        values.length = 0;
        values.push(...scoped.values);
      }

      const res = await pool.query(baseQuery, values);
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
    const existing = await commentsModel.getById(id, centerId, isMultiCenter);
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
    const existing = await commentsModel.getById(id, centerId, isMultiCenter);
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

module.exports = commentsModel;
