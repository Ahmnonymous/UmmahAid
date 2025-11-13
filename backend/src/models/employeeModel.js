const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Employee";

const buildBaseQuery = (allowedUserTypes) => {
  let text = `SELECT * FROM ${tableName}`;
  const values = [];

  if (allowedUserTypes && Array.isArray(allowedUserTypes) && allowedUserTypes.length > 0) {
    text += ` WHERE user_type = ANY($1::int[])`;
    values.push(allowedUserTypes);
  }

  return { text, values };
};

const employeeModel = {
  getAll: async (centerId = null, allowedUserTypes = null) => {
    try {
      const base = buildBaseQuery(allowedUserTypes);
      const scoped = scopeQuery(base, {
        centerId,
        isSuperAdmin: centerId === null || centerId === undefined,
        column: "center_id",
        enforce: centerId !== null && centerId !== undefined,
      });

      const res = await pool.query(scoped.text, scoped.values);
      return res.rows;
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, centerId = null) => {
    try {
      const scoped = scopeQuery(
        {
          text: `SELECT * FROM ${tableName} WHERE id = $1::int`,
          values: [id],
        },
        {
          centerId,
          isSuperAdmin: centerId === null || centerId === undefined,
          column: "center_id",
          enforce: centerId !== null && centerId !== undefined,
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

  update: async (id, fields, centerId = null) => {
    const existing = await employeeModel.getById(id, centerId);
    if (!existing) {
      return null;
    }

    try {
      const { setClause, values } = buildUpdateFragments(fields);
      const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${
        values.length + 1
      }::int RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, centerId = null) => {
    const existing = await employeeModel.getById(id, centerId);
    if (!existing) {
      return null;
    }

    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1::int RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = employeeModel;
