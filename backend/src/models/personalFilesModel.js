const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Personal_Files";

const normalizeFiles = (records = []) =>
  records.map((record) => {
    const clone = { ...record };
    if (clone.file && clone.file_filename) {
      clone.file = "exists";
    } else if (clone.file && typeof clone.file !== "string") {
      clone.file = clone.file.toString("base64");
    }
    return clone;
  });

const personalFilesModel = {
  getAll: async (username = null) => {
    try {
      let text = `SELECT * FROM ${tableName}`;
      const values = [];
      
      // ✅ Filter by created_by (username) - each user sees only their own files
      if (username) {
        text += ` WHERE created_by = $1`;
        values.push(username);
      }

      text += ` ORDER BY created_at DESC`;

      const res = await pool.query(text, values);
      return normalizeFiles(res.rows);
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, username = null) => {
    try {
      let text = `SELECT * FROM ${tableName} WHERE id = $1`;
      const values = [id];
      
      // ✅ Filter by created_by (username) - each user sees only their own files
      if (username) {
        text += ` AND created_by = $2`;
        values.push(username);
      }

      const res = await pool.query(text, values);
      if (!res.rows[0]) return null;
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(
        `Error fetching record by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  getByIdWithFile: async (id, username = null) => {
    try {
      let text = `SELECT * FROM ${tableName} WHERE id = $1`;
      const values = [id];
      
      // ✅ Filter by created_by (username) - each user sees only their own files
      if (username) {
        text += ` AND created_by = $2`;
        values.push(username);
      }

      const res = await pool.query(text, values);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error fetching record with file by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  create: async (fields) => {
    try {
      const { columns, values, placeholders } = buildInsertFragments(fields);
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, username = null) => {
    const existing = await personalFilesModel.getById(id, username);
    if (!existing) {
      return null;
    }

    try {
      const { setClause, values } = buildUpdateFragments(fields);
      let query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1}`;
      const queryValues = [...values, id];
      
      // ✅ Filter by created_by (username) - each user can only update their own files
      if (username) {
        query += ` AND created_by = $${queryValues.length + 1}`;
        queryValues.push(username);
      }
      
      query += ` RETURNING *`;
      const res = await pool.query(query, queryValues);
      if (res.rowCount === 0) return null;
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, username = null) => {
    const existing = await personalFilesModel.getById(id, username);
    if (!existing) {
      return null;
    }

    try {
      let query = `DELETE FROM ${tableName} WHERE id = $1`;
      const values = [id];
      
      // ✅ Filter by created_by (username) - each user can only delete their own files
      if (username) {
        query += ` AND created_by = $2`;
        values.push(username);
      }
      
      query += ` RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rowCount === 0) return null;
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = personalFilesModel;
