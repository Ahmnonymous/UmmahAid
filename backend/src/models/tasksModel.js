const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Tasks";

const tasksModel = {
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
      // Include tasks with center_id = null for backward compatibility with old tasks
      const shouldEnforceCenterFilter = !!centerId && !isMultiCenter;
      const isFileSpecificView = fileId !== null && fileId !== undefined;
      
      if (shouldEnforceCenterFilter && isFileSpecificView) {
        // For file-specific views, include tasks with center_id = null OR center_id = user's center_id
        conditions.push(`(center_id IS NULL OR center_id = $${values.length + 1})`);
        values.push(centerId);
      } else if (shouldEnforceCenterFilter) {
        // For general views, enforce strict center_id filtering
        conditions.push(`center_id = $${values.length + 1}`);
        values.push(centerId);
      }

      // Build the WHERE clause
      if (conditions.length > 0) {
        baseQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Apply ordering
      baseQuery += ` ORDER BY created_at DESC`;

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
    const existing = await tasksModel.getById(id, centerId, isMultiCenter);
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
    const existing = await tasksModel.getById(id, centerId, isMultiCenter);
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

module.exports = tasksModel;
