const pool = require('../config/db');

const tableName = 'supplier_document';

const supplierDocumentModel = {
  getAll: async (centerId, supplierId = null) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      let params = [];
      let paramCount = 0;
      
      const conditions = [];
      
      if (centerId) {
        paramCount++;
        conditions.push(`center_id = $${paramCount}`);
        params.push(centerId);
      }
      
      if (supplierId) {
        paramCount++;
        conditions.push(`supplier_id = $${paramCount}`);
        params.push(supplierId);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const res = await pool.query(query, params);
      res.rows = res.rows.map(r => { 
        if (r.file && r.file_filename) {
          r.file = 'exists';
        } else if (r.file) {
          r.file = r.file.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Supplier_Document: " + err.message);
    }
  },

  getById: async (id, centerId) => {
    try {
      let query = `SELECT * FROM ${tableName} WHERE id = $1`;
      let params = [id];
      
      if (centerId) {
        query += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Supplier_Document: " + err.message);
    }
  },

  create: async (fields, centerId) => {
    try {
      // Add center_id if provided
      if (centerId) {
        fields.center_id = centerId;
      }
      
      const columns = Object.keys(fields).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Supplier_Document: " + err.message);
    }
  },

  update: async (id, fields, centerId) => {
    try {
      let query = `UPDATE ${tableName} SET `;
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      query += setClauses;
      
      const values = Object.values(fields);
      let paramIndex = values.length + 1;
      
      query += ` WHERE id = $${paramIndex}`;
      values.push(id);
      
      if (centerId) {
        paramIndex++;
        query += ` AND center_id = $${paramIndex}`;
        values.push(centerId);
      }
      
      query += ` RETURNING *`;
      
      const res = await pool.query(query, values);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Supplier_Document: " + err.message);
    }
  },

  delete: async (id, centerId) => {
    try {
      let query = `DELETE FROM ${tableName} WHERE id = $1`;
      let params = [id];
      
      if (centerId) {
        query += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      query += ` RETURNING *`;
      
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Supplier_Document: " + err.message);
    }
  }
};

module.exports = supplierDocumentModel;
