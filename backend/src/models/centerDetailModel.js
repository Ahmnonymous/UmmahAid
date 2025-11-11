const pool = require('../config/db');

const tableName = 'Center_Detail';

const centerDetailModel = {
  getAll: async () => {
    try {
      const res = await pool.query(`SELECT * FROM ${tableName}`);
      res.rows = res.rows.map(r => { 
        // Mark files as exists if they have metadata
        if (r.logo && r.logo_filename) {
          r.logo = 'exists';
        } else if (r.logo) {
          r.logo = r.logo.toString('base64');
        }
        if (r.qr_code_service_url && r.qr_code_service_url_filename) {
          r.qr_code_service_url = 'exists';
        } else if (r.qr_code_service_url) {
          r.qr_code_service_url = r.qr_code_service_url.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Center_Detail: " + err.message);
    }
  },

  getById: async (id) => {
    try {
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const res = await pool.query(query, [id]);
      if (!res.rows[0]) return null;
      // Don't convert to base64 for getById - keep as Buffer for view/download endpoints
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Center_Detail: " + err.message);
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
      throw new Error("Error creating record in Center_Detail: " + err.message);
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
      throw new Error("Error updating record in Center_Detail: " + err.message);
    }
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Center_Detail: " + err.message);
    }
  },

  getMetrics: async (centerId) => {
    try {
      const query = `
        SELECT
          COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM applicant_details
            WHERE center_id = $1
          ), 0) AS total_applicants,
          COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM relationships
            WHERE center_id = $1
          ), 0) AS total_relationships,
          COALESCE((
            SELECT SUM(financial_amount)::NUMERIC
            FROM financial_assistance
            WHERE center_id = $1
          ), 0)::NUMERIC AS total_financial_assistance,
          COALESCE((
            SELECT SUM(financial_cost)::NUMERIC
            FROM food_assistance
            WHERE center_id = $1
          ), 0)::NUMERIC AS total_food_assistance
      `;
      const res = await pool.query(query, [centerId]);
      if (!res.rows?.length) {
        return {
          total_applicants: 0,
          total_relationships: 0,
          total_financial_assistance: 0,
          total_food_assistance: 0,
        };
      }
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching center metrics: " + err.message);
    }
  },
};

module.exports = centerDetailModel;
