const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Conversations";

const conversationsModel = {
  getAll: async (centerId = null, userId = null) => {
    try {
      // ✅ Filter by participant - users only see conversations they're part of
      // App Admin (centerId=null) can see all conversations, but still filter by participant for privacy
      let query = `SELECT DISTINCT c.* FROM ${tableName} c`;
      const values = [];
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // PostgreSQL stores unquoted identifiers as lowercase
        query += ` INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id WHERE cp.employee_id = $1`;
        values.push(userId);
        
        // Also apply center filter if not App Admin
        if (centerId !== null) {
          query += ` AND c.center_id = $2`;
          values.push(centerId);
        }
      } else if (centerId !== null) {
        // If no userId but centerId exists, filter by center only (fallback)
        query += ` WHERE c.center_id = $1`;
        values.push(centerId);
      }
      // If both are null (App Admin), show all conversations
      
      query += ` ORDER BY c."Updated_At" DESC`;

      const res = await pool.query(query, values);
      return res.rows;
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, centerId = null, userId = null) => {
    try {
      // ✅ Filter by participant - users can only view conversations they're part of
      let query = `SELECT DISTINCT c.* FROM ${tableName} c`;
      const values = [id];
      let whereConditions = [`c.id = $1`];
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // PostgreSQL stores unquoted identifiers as lowercase
        query += ` INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        values.push(userId);
      } else if (centerId !== null) {
        // Fallback to center filter if no userId
        whereConditions.push(`c.center_id = $${values.length + 1}`);
        values.push(centerId);
      }
      
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      
      const res = await pool.query(query, values);
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
    const existing = await conversationsModel.getById(id, centerId);
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

  delete: async (id, centerId = null) => {
    const existing = await conversationsModel.getById(id, centerId);
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
};

module.exports = conversationsModel;
