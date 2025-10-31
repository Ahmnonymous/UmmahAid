const pool = require('../config/db');

const tableName = 'Messages';

const messagesModel = {
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      if (centerId && !isMultiCenter) {
        query += ` WHERE center_id = $1`;
        params.push(centerId);
      }
      const res = await pool.query(query, params);
      res.rows = res.rows.map(r => { 
        if (r.attachment && r.attachment_filename) {
          r.attachment = 'exists';
        } else if (r.attachment) {
          r.attachment = r.attachment.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Messages: " + err.message);
    }
  },

  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      const query = `SELECT * FROM ${tableName} WHERE ${where}`;
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Messages: " + err.message);
    }
  },

  create: async (fields) => {
    try {
      const columns = Object.keys(fields).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Messages: " + err.message);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let where = `id = $${values.length + 1}`;
      const params = [...values, id];
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $${values.length + 2}`;
        params.push(centerId);
      }
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Messages: " + err.message);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      const query = `DELETE FROM ${tableName} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Messages: " + err.message);
    }
  }
};

module.exports = messagesModel;
