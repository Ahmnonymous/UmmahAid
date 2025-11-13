const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "supplier_document";

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

const supplierDocumentModel = {
  getAll: async (centerId = null, supplierId = null, isMultiCenter = false) =>
    {
      try {
        let text = `SELECT * FROM ${tableName}`;
        const values = [];
        const conditions = [];

        if (supplierId) {
          conditions.push(`supplier_id = $${values.length + 1}`);
          values.push(supplierId);
        }

        if (conditions.length > 0) {
          text += ` WHERE ${conditions.join(" AND ")}`;
        }

        const scoped = scopeQuery(
          { text, values },
          {
            centerId,
            isSuperAdmin: isMultiCenter,
            column: "center_id",
            enforce: !!centerId && !isMultiCenter,
          },
        );

        const res = await pool.query(scoped.text, scoped.values);
        return normalizeFiles(res.rows);
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
          text: `SELECT * FROM ${tableName} WHERE id = $1`,
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
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(
        `Error fetching record by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  create: async (fields, centerId) => {
    try {
      const payload = { ...fields };
      if (centerId) {
        payload.center_id = centerId;
      }

      const { columns, values, placeholders } = buildInsertFragments(payload, {
        quote: false,
      });
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    const existing = await supplierDocumentModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
    if (!existing) {
      return null;
    }

    try {
      const { setClause, values } = buildUpdateFragments(fields, {
        quote: false,
      });
      const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${
        values.length + 1
      } RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    const existing = await supplierDocumentModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
    if (!existing) {
      return null;
    }

    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = supplierDocumentModel;
