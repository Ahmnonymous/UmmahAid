const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Financial_Assistance";

const financialAssistanceModel = {
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(`SELECT * FROM ${tableName}`, {
        centerId,
        isSuperAdmin: isMultiCenter,
        column: "center_id",
        enforce: !!centerId && !isMultiCenter,
      });

      const res = await pool.query(scoped.text, scoped.values);
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
    const existing = await financialAssistanceModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
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
    const existing = await financialAssistanceModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
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

  getRecurringTemplates: async (referenceDate = new Date()) => {
    try {
      const query = `
        SELECT *
        FROM ${tableName}
        WHERE is_recurring = true
          AND starting_date IS NOT NULL
          AND end_date IS NOT NULL
          AND starting_date <= $1
          AND end_date >= $2
          AND is_auto_generated = false
      `;
      const refDate = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
      const dateParam = refDate.toISOString().split('T')[0];
      const res = await pool.query(query, [dateParam, dateParam]);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching recurring templates from Financial_Assistance: " + err.message);
    }
  },

  getLastGeneratedAssistanceDate: async (templateId) => {
    try {
      const query = `
        SELECT MAX(date_of_assistance) AS last_date
        FROM ${tableName}
        WHERE id = $1 OR recurring_source_id = $1
      `;
      const res = await pool.query(query, [templateId]);
      return res.rows[0]?.last_date || null;
    } catch (err) {
      throw new Error("Error fetching last generated assistance date: " + err.message);
    }
  },

  findOccurrenceByTemplateAndDate: async (templateId, targetDate) => {
    try {
      const query = `
        SELECT *
        FROM ${tableName}
        WHERE (id = $1 OR recurring_source_id = $1)
          AND date_of_assistance = $2
        LIMIT 1
      `;
      const res = await pool.query(query, [templateId, targetDate]);
      return res.rows[0] || null;
    } catch (err) {
      throw new Error("Error finding assistance occurrence by date: " + err.message);
    }
  }
};

module.exports = financialAssistanceModel;
