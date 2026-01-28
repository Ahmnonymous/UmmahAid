const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Applicant_Details";

function normalizeHealthForApi(health) {
  if (health == null) return [];
  if (Array.isArray(health)) return health.map((v) => (typeof v === "number" ? v : parseInt(v, 10))).filter((n) => !Number.isNaN(n));
  if (typeof health === "string") {
    try {
      const parsed = JSON.parse(health);
      return Array.isArray(parsed) ? parsed.map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n)) : [];
    } catch (_) {
      const n = parseInt(health, 10);
      return Number.isNaN(n) ? [] : [n];
    }
  }
  if (typeof health === "number" && !Number.isNaN(health)) return [health];
  return [];
}

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
          next_of_kin_name, next_of_kin_surname, next_of_kin_contact_number, next_of_kin_gender,
          created_by, created_at, updated_by, updated_at, center_id,
          signature_filename, signature_mime, signature_size
        FROM ${tableName}
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Add search filter if provided (searches name, surname, full name, file_number, id_number)
      if (search) {
        const searchTrimmed = search.trim();
        
        // Search in individual fields AND concatenated full name (name + surname)
        // This allows searching "Asif Muhammad" to match name="Asif" surname="Muhammad"
        conditions.push(`(
          name ILIKE $${paramIndex} OR 
          surname ILIKE $${paramIndex} OR 
          CONCAT(name, ' ', surname) ILIKE $${paramIndex} OR
          CONCAT(surname, ' ', name) ILIKE $${paramIndex} OR
          file_number ILIKE $${paramIndex} OR 
          id_number ILIKE $${paramIndex}
        )`);
        values.push(`%${searchTrimmed}%`);
        paramIndex++;
        
        console.log(`[applicantDetailsModel.getAll] Search term: "${searchTrimmed}"`);
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

      // Return metadata only (no signature BLOB); normalize health to array for API
      const data = res.rows.map((row) => ({
        ...row,
        signature: row.signature_filename ? "exists" : null, // Indicate signature exists without loading it
        health: normalizeHealthForApi(row.health),
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
      const row = res.rows[0];
      return { ...row, health: normalizeHealthForApi(row.health) };
    } catch (err) {
      throw new Error(
        `Error fetching record by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  create: async (fields) => {
    try {
      const keys = Object.keys(fields);
      const { columns, values, placeholders } = buildInsertFragments(fields, {
        quote: false,
      });
      const placeholdersWithCast = placeholders
        .split(", ")
        .map((p, i) => (keys[i] === "health" ? `${p}::jsonb` : p))
        .join(", ");
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholdersWithCast}) RETURNING *`;
      const res = await pool.query(query, values);
      const row = res.rows[0];
      return row ? { ...row, health: normalizeHealthForApi(row.health) } : null;
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, isSuperAdmin = false) => {
    try {
      const keys = Object.keys(fields);
      const { setClause, values } = buildUpdateFragments(fields, {
        quote: false,
      });
      const setClauseWithCast = setClause
        .split(", ")
        .map((part, i) => (keys[i] === "health" ? part.replace(/=\s*\$\d+$/, (m) => m + "::jsonb") : part))
        .join(", ");
      const scoped = scopeQuery(
        {
          text: `UPDATE ${tableName} SET ${setClauseWithCast} WHERE id = $${
            values.length + 1
          } RETURNING *`,
          values: [...values, id],
        },
        { centerId, isSuperAdmin, column: "center_id" },
      );

      const res = await pool.query(scoped.text, scoped.values);
      if (res.rowCount === 0) return null;
      const row = res.rows[0];
      return row ? { ...row, health: normalizeHealthForApi(row.health) } : null;
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
