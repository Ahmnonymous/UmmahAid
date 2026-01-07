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
  getAll: async (username = null, fullName = null) => {
    try {
      let text = `SELECT * FROM ${tableName}`;
      const values = [];
      
      // ✅ Filter by created_by - match either username or full_name
      // This handles both old records (saved with full names) and new records (saved with username)
      if (username) {
        if (fullName) {
          text += ` WHERE (created_by = $1 OR created_by = $2)`;
          values.push(username, fullName);
        } else {
          text += ` WHERE created_by = $1`;
          values.push(username);
        }
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

  getById: async (id, username = null, fullName = null) => {
    try {
      let text = `SELECT * FROM ${tableName} WHERE id = $1`;
      const values = [id];
      
      // ✅ Filter by created_by - match either username or full_name
      if (username) {
        if (fullName) {
          text += ` AND (created_by = $2 OR created_by = $3)`;
          values.push(username, fullName);
        } else {
          text += ` AND created_by = $2`;
          values.push(username);
        }
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

  getByIdWithFile: async (id, username = null, fullName = null) => {
    try {
      let text = `SELECT * FROM ${tableName} WHERE id = $1`;
      const values = [id];
      
      // ✅ Filter by created_by - match either username or full_name
      if (username) {
        if (fullName) {
          text += ` AND (created_by = $2 OR created_by = $3)`;
          values.push(username, fullName);
        } else {
          text += ` AND created_by = $2`;
          values.push(username);
        }
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

  update: async (id, fields, username = null, fullName = null) => {
    const existing = await personalFilesModel.getById(id, username, fullName);
    if (!existing) {
      return null;
    }

    try {
      const { setClause, values } = buildUpdateFragments(fields);
      let query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1}`;
      const queryValues = [...values, id];
      
      // ✅ Filter by created_by - match either username or full_name
      if (username) {
        if (fullName) {
          query += ` AND (created_by = $${queryValues.length + 1} OR created_by = $${queryValues.length + 2})`;
          queryValues.push(username, fullName);
        } else {
          query += ` AND created_by = $${queryValues.length + 1}`;
          queryValues.push(username);
        }
      }
      
      query += ` RETURNING *`;
      const res = await pool.query(query, queryValues);
      if (res.rowCount === 0) return null;
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, username = null, fullName = null) => {
    const existing = await personalFilesModel.getById(id, username, fullName);
    if (!existing) {
      return null;
    }

    try {
      let query = `DELETE FROM ${tableName} WHERE id = $1`;
      const values = [id];
      
      // ✅ Filter by created_by - match either username or full_name
      if (username) {
        if (fullName) {
          query += ` AND (created_by = $2 OR created_by = $3)`;
          values.push(username, fullName);
        } else {
          query += ` AND created_by = $2`;
          values.push(username);
        }
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
