const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Attachments";

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

const attachmentsModel = {
  /**
   * Get all attachments (LEAN - excludes BLOB data for performance)
   * @param {number|null} centerId - Center ID for filtering
   * @param {boolean} isMultiCenter - If true, bypass center filtering
   * @param {object} pagination - { page: number, limit: number, file_id?: number }
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  getAll: async (centerId = null, isMultiCenter = false, pagination = {}) => {
    try {
      const { page = 1, limit = 50, file_id = null } = pagination;
      const offset = (page - 1) * limit;
      const maxLimit = Math.min(limit, 200); // Cap at 200 items per page

      // ✅ CRITICAL: Exclude 'file' (bytea) column from list queries
      // Only fetch metadata - binary data fetched separately via getRawFile()
      let baseQuery = `
        SELECT 
          id, 
          file_id, 
          attachment_name, 
          attachment_details,
          file_filename, 
          file_mime, 
          file_size,
          created_by, 
          created_at, 
          updated_by, 
          updated_at, 
          center_id
        FROM ${tableName}
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Filter by file_id if provided (for applicant detail views)
      if (file_id !== null) {
        conditions.push(`file_id = $${paramIndex}`);
        values.push(file_id);
        paramIndex++;
      }

      // Apply center filtering
      const scoped = scopeQuery(
        conditions.length > 0
          ? { text: baseQuery + ' WHERE ' + conditions.join(' AND '), values }
          : baseQuery,
        {
          centerId,
          isSuperAdmin: isMultiCenter,
          column: "center_id",
          enforce: !!centerId && !isMultiCenter,
        },
      );

      // Get total count for pagination
      const countQuery = scoped.text.replace(
        /SELECT[\s\S]*?FROM/i,
        'SELECT COUNT(*) as total FROM',
      );
      const countRes = await pool.query(countQuery, scoped.values);
      const total = parseInt(countRes.rows[0]?.total || 0);

      // Add pagination and ordering
      const finalQuery = `
        ${scoped.text}
        ORDER BY created_at DESC
        LIMIT $${scoped.values.length + 1} OFFSET $${scoped.values.length + 2}
      `;
      const finalValues = [...scoped.values, maxLimit, offset];

      const res = await pool.query(finalQuery, finalValues);

      // Return metadata only (no BLOB conversion needed)
      const data = res.rows.map((row) => ({
        ...row,
        file: row.file_filename ? "exists" : null, // Indicate file exists without loading it
      }));

      return {
        data,
        pagination: {
          page,
          limit: maxLimit,
          total,
          totalPages: Math.ceil(total / maxLimit),
          hasNext: page * maxLimit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  /**
   * Get attachment by ID (LEAN - excludes BLOB data)
   * Use getRawFile() if you need the actual file binary
   */
  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(
        {
          text: `
            SELECT 
              id, 
              file_id, 
              attachment_name, 
              attachment_details,
              file_filename, 
              file_mime, 
              file_size,
              created_by, 
              created_at, 
              updated_by, 
              updated_at, 
              center_id
            FROM ${tableName} 
            WHERE id = $1
          `,
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
      
      // Return metadata only (no BLOB)
      return {
        ...res.rows[0],
        file: res.rows[0].file_filename ? "exists" : null,
      };
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
      return normalizeFiles(res.rows)[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    const existing = await attachmentsModel.getById(id, centerId, isMultiCenter);
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
    const existing = await attachmentsModel.getById(id, centerId, isMultiCenter);
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

  // Get raw file data without normalization (for viewing/downloading)
  getRawFile: async (id, centerId = null, isMultiCenter = false) => {
    try {
      const scoped = scopeQuery(
        {
          text: `SELECT file, file_filename, file_mime, file_size FROM ${tableName} WHERE id = $1`,
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
        `Error fetching raw file from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = attachmentsModel;
