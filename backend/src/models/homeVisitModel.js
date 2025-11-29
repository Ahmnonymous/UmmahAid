const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Home_Visit";

const normalizeAttachments = (records = []) =>
  records.map((record) => {
    const clone = { ...record };

    if (clone.attachment_1 && clone.attachment_1_filename) {
      clone.attachment_1 = "exists";
    } else if (clone.attachment_1 && typeof clone.attachment_1 !== "string") {
      clone.attachment_1 = clone.attachment_1.toString("base64");
    }

    if (clone.attachment_2 && clone.attachment_2_filename) {
      clone.attachment_2 = "exists";
    } else if (clone.attachment_2 && typeof clone.attachment_2 !== "string") {
      clone.attachment_2 = clone.attachment_2.toString("base64");
    }

    return clone;
  });

const transformRecord = (record) => normalizeAttachments([record])[0] || null;

const homeVisitModel = {
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(`SELECT * FROM ${tableName}`, {
        centerId,
        isSuperAdmin: isMultiCenter,
        column: "center_id",
        enforce: !!centerId && !isMultiCenter,
      });

      const res = await pool.query(scoped.text, scoped.values);
      return normalizeAttachments(res.rows);
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
      return transformRecord(res.rows[0]);
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
      return transformRecord(res.rows[0]);
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    const existing = await homeVisitModel.getById(id, centerId, isMultiCenter);
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
      return transformRecord(res.rows[0]);
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    const existing = await homeVisitModel.getById(id, centerId, isMultiCenter);
    if (!existing) {
      return null;
    }

    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return transformRecord(res.rows[0]);
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },

  // Get raw attachment data without normalization (for viewing/downloading)
  getRawAttachment: async (id, attachmentField, centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(
        {
          text: `SELECT ${attachmentField}, ${attachmentField}_filename, ${attachmentField}_mime, ${attachmentField}_size FROM ${tableName} WHERE id = $1`,
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
        `Error fetching raw attachment from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = homeVisitModel;
