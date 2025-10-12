const pool = require('../config/db');

const tableName = 'Employee_Skills';

const employeeSkillsModel = {
  getAll: async () => {
    try {
      const res = await pool.query(`SELECT * FROM ${tableName}`);
      res.rows = res.rows.map(r => { 
        // Convert attachment to base64 only if no filename exists (for display)
        if (r.attachment && !r.attachment_filename) {
          r.attachment = r.attachment.toString('base64');
        } else if (r.attachment && r.attachment_filename) {
          // Mark that attachment exists but don't convert to base64
          r.attachment = 'exists';
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Employee_Skills: " + err.message);
    }
  },

  getById: async (id) => {
    try {
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const res = await pool.query(query, [id]);
      if (!res.rows[0]) return null;
      if (res.rows[0].attachment) res.rows[0].attachment = res.rows[0].attachment.toString('base64');
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Employee_Skills: " + err.message);
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
      throw new Error("Error creating record in Employee_Skills: " + err.message);
    }
  },

  update: async (id, fields) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE id = $${values.length + 1} RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Employee_Skills: " + err.message);
    }
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Employee_Skills: " + err.message);
    }
  }
};

module.exports = employeeSkillsModel;
