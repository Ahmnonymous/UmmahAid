const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "supplier_evaluation";

const mapRow = (row) => ({
  id: row.id,
  center_id: row.center_id,
  supplier_id: row.supplier_id,
  eval_date: row.eval_date,
  quality_score: row.quality_score,
  delivery_score: row.delivery_score,
  cost_score: row.cost_score,
  ohs_score: row.ohs_score,
  env_score: row.env_score,
  quality_wt: row.quality_wt,
  delivery_wt: row.delivery_wt,
  cost_wt: row.cost_wt,
  ohs_wt: row.ohs_wt,
  env_wt: row.env_wt,
  overall_score: row.overall_score,
  status: row.status,
  expiry_date: row.expiry_date,
  notes: row.notes,
  created_by: row.created_by,
  updated_by: row.updated_by,
  datestamp: row.datestamp,
  updated_at: row.updated_at,
});

const toDbFields = (fields = {}) => {
  const dbFields = {};
  const assignIfPresent = (key, value) => {
    if (value !== undefined && value !== null) {
      dbFields[key] = value;
    }
  };

  assignIfPresent("supplier_id", fields.supplier_id);
  assignIfPresent("eval_date", fields.eval_date);
  assignIfPresent("quality_score", fields.quality_score);
  assignIfPresent("delivery_score", fields.delivery_score);
  assignIfPresent("cost_score", fields.cost_score);
  assignIfPresent("ohs_score", fields.ohs_score);
  assignIfPresent("env_score", fields.env_score);
  assignIfPresent("quality_wt", fields.quality_wt);
  assignIfPresent("delivery_wt", fields.delivery_wt);
  assignIfPresent("cost_wt", fields.cost_wt);
  assignIfPresent("ohs_wt", fields.ohs_wt);
  assignIfPresent("env_wt", fields.env_wt);
  assignIfPresent("overall_score", fields.overall_score);
  assignIfPresent("status", fields.status);
  assignIfPresent("expiry_date", fields.expiry_date);
  assignIfPresent("notes", fields.notes);
  assignIfPresent("created_by", fields.created_by);
  assignIfPresent("updated_by", fields.updated_by);
  assignIfPresent("center_id", fields.center_id);

  return dbFields;
};

const supplierEvaluationModel = {
  getAll: async (centerId = null, supplierId = null, isMultiCenter = false) => {
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
          column: '"center_id"',
          enforce: !!centerId && !isMultiCenter,
        },
      );

      const res = await pool.query(scoped.text, scoped.values);
      return res.rows.map(mapRow);
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
          column: '"center_id"',
          enforce: !!centerId && !isMultiCenter,
        },
      );

      const res = await pool.query(scoped.text, scoped.values);
      if (!res.rows[0]) return null;
      return mapRow(res.rows[0]);
    } catch (err) {
      throw new Error(
        `Error fetching record by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  create: async (fields, centerId) => {
    try {
      const payload = toDbFields({
        ...fields,
        center_id: centerId ?? fields.center_id,
      });

      const { columns, values, placeholders } = buildInsertFragments(payload);
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return mapRow(res.rows[0]);
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    const existing = await supplierEvaluationModel.getById(
      id,
      centerId,
      isMultiCenter,
    );
    if (!existing) {
      return null;
    }

    try {
      const payload = toDbFields(fields);
      const { setClause, values } = buildUpdateFragments(payload);
      const query = `UPDATE ${tableName} SET ${setClause} WHERE "id" = $${
        values.length + 1
      } RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return mapRow(res.rows[0]);
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    const existing = await supplierEvaluationModel.getById(
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
      return mapRow(res.rows[0]);
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = supplierEvaluationModel;
