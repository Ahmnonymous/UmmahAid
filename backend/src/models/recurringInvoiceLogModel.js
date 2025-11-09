const pool = require('../config/db');

const tableName = 'Recurring_Invoice_Log';

const recurringInvoiceLogModel = {
  create: async (fields) => {
    try {
      const columns = Object.keys(fields).map((key) => `"${key}"`).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error('Error creating record in Recurring_Invoice_Log: ' + err.message);
    }
  },

  getLastRunForSource: async (sourceFinancialAidId) => {
    try {
      const query = `
        SELECT *
        FROM ${tableName}
        WHERE source_financial_aid_id = $1
        ORDER BY created_date DESC
        LIMIT 1
      `;
      const res = await pool.query(query, [sourceFinancialAidId]);
      return res.rows[0] || null;
    } catch (err) {
      throw new Error('Error fetching last recurring invoice log: ' + err.message);
    }
  },

  findLogBySourceAndDate: async (sourceFinancialAidId, targetDate) => {
    try {
      const query = `
        SELECT *
        FROM ${tableName}
        WHERE source_financial_aid_id = $1
          AND next_run_date = $2
        LIMIT 1
      `;
      const res = await pool.query(query, [sourceFinancialAidId, targetDate]);
      return res.rows[0] || null;
    } catch (err) {
      throw new Error('Error finding recurring invoice log: ' + err.message);
    }
  }
};

module.exports = recurringInvoiceLogModel;


