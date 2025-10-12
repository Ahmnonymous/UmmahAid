const pool = require('../config/db');

const tableName = 'Employee_Initiative';

const employeeInitiativeModel = {
  getAll: async () => {
    try {
      const res = await pool.query(`SELECT * FROM ${tableName}`);

      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Employee_Initiative: " + err.message);
    }
  },

  getById: async (id) => {
    try {
      const query = `SELECT * FROM ${tableName} WHERE "id" = $1`;
      const res = await pool.query(query, [id]);
      if (!res.rows[0]) return null;

      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Employee_Initiative: " + err.message);
    }
  },

  create: async (fields) => {
    try {
      const columns = Object.keys(fields).map(k => `"${k}"`).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Employee_Initiative: " + err.message);
    }
  },

  update: async (id, fields) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE "id" = $${values.length + 1} RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Employee_Initiative: " + err.message);
    }
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM ${tableName} WHERE "id" = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Employee_Initiative: " + err.message);
    }
  }
};

module.exports = employeeInitiativeModel;
