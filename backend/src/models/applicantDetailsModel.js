const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Applicant_Details";

const applicantDetailsModel = {
  getAll: async (centerId = null, isSuperAdmin = false) => {
    try {
      const scoped = scopeQuery(`SELECT * FROM ${tableName}`, {
        centerId,
        isSuperAdmin,
        column: "center_id",
      });

      const res = await pool.query(scoped.text, scoped.values);
      res.rows = res.rows.map((row) => {
        if (row.signature && row.signature_filename) {
          row.signature = "exists";
        } else if (row.signature) {
          row.signature = row.signature.toString("base64");
        }
        return row;
      });
      return res.rows;
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, centerId = null, isSuperAdmin = false) => {
    try {
      const scoped = scopeQuery(
        {
          text: `SELECT * FROM ${tableName} WHERE id = $1`,
          values: [id],
        },
        { centerId, isSuperAdmin, column: "center_id" },
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
      const { columns, values, placeholders } = buildInsertFragments(fields, {
        quote: false,
      });
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isSuperAdmin = false) => {
    try {
      const { setClause, values } = buildUpdateFragments(fields, {
        quote: false,
      });
      const scoped = scopeQuery(
        {
          text: `UPDATE ${tableName} SET ${setClause} WHERE id = $${
            values.length + 1
          } RETURNING *`,
          values: [...values, id],
        },
        { centerId, isSuperAdmin, column: "center_id" },
      );

      const res = await pool.query(scoped.text, scoped.values);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error updating record in ${tableName}: ${err.message}`,
      );
    }
  },

  delete: async (id, centerId = null, isSuperAdmin = false) => {
    try {
      const scoped = scopeQuery(
        {
          text: `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
          values: [id],
        },
        { centerId, isSuperAdmin, column: "center_id" },
      );

      const res = await pool.query(scoped.text, scoped.values);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = applicantDetailsModel;
