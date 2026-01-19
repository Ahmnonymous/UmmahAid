const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Applicant_Details";

const applicantDetailsModel = {
  /**
   * Get all applicants (LEAN - excludes signature BLOB for performance)
   * @param {number|null} centerId - Center ID for filtering
   * @param {boolean} isSuperAdmin - If true, bypass center filtering
   * @param {object} pagination - { page: number, limit: number, sort?: string, order?: string, search?: string }
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  getAll: async (centerId = null, isSuperAdmin = false, pagination = {}) => {
    try {
      const { page = 1, limit = 50, sort = 'created_at', order = 'DESC', search = null } = pagination;
      const offset = (page - 1) * limit;
      const maxLimit = Math.min(limit, 200); // Cap at 200 items per page

      // ✅ CRITICAL: Exclude 'signature' (bytea) column from list queries
      // Only fetch metadata - signature fetched separately if needed
      let baseQuery = `
        SELECT 
          id, file_number, name, surname, muslim_name, id_number,
          date_intake, cell_number, alternate_number, email_address,
          street_address, popia_agreement,
          race, nationality, gender, file_condition, file_status,
          highest_education_level, marital_status, employment_status,
          suburb, dwelling_type, dwelling_status, health, skills,
          born_religion_id, period_as_muslim_id,
          created_by, created_at, updated_by, updated_at, center_id,
          signature_filename, signature_mime, signature_size
        FROM ${tableName}
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Add search filter if provided (searches name, surname, file_number, id_number)
      if (search) {
        conditions.push(`(
          name ILIKE $${paramIndex} OR 
          surname ILIKE $${paramIndex} OR 
          file_number ILIKE $${paramIndex} OR 
          id_number ILIKE $${paramIndex}
        )`);
        values.push(`%${search}%`);
        paramIndex++;
      }

      // Apply center filtering
      const scoped = scopeQuery(
        conditions.length > 0
          ? { text: baseQuery + ' WHERE ' + conditions.join(' AND '), values }
          : baseQuery,
        {
          centerId,
          isSuperAdmin,
          column: "center_id",
        },
      );

      // Get total count for pagination
      const countQuery = scoped.text.replace(
        /SELECT[\s\S]*?FROM/i,
        'SELECT COUNT(*) as total FROM',
      );
      const countRes = await pool.query(countQuery, scoped.values);
      const total = parseInt(countRes.rows[0]?.total || 0);

      // Validate sort column to prevent SQL injection
      const allowedSortColumns = [
        'id', 'file_number', 'name', 'surname', 'date_intake', 
        'created_at', 'updated_at', 'file_status', 'file_condition'
      ];
      const safeSort = allowedSortColumns.includes(sort.toLowerCase()) 
        ? sort.toLowerCase() 
        : 'created_at';
      const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Add pagination and ordering
      const finalQuery = `
        ${scoped.text}
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT $${scoped.values.length + 1} OFFSET $${scoped.values.length + 2}
      `;
      const finalValues = [...scoped.values, maxLimit, offset];

      const res = await pool.query(finalQuery, finalValues);

      // Return metadata only (no signature BLOB)
      const data = res.rows.map((row) => ({
        ...row,
        signature: row.signature_filename ? "exists" : null, // Indicate signature exists without loading it
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
