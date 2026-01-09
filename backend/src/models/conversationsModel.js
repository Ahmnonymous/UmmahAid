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
      // Also include unread message count for each conversation
      const values = [];
      let paramIndex = 1;
      
      console.log('[DEBUG] Conversations.getAll - centerId:', centerId, 'userId:', userId);
      
      let query = `SELECT DISTINCT c.*`;
      
      // Add unread count subquery if userId is provided
      if (userId) {
        query += `, COALESCE(
          (SELECT COUNT(*) 
           FROM Messages m 
           WHERE m.conversation_id = c.id 
             AND m.sender_id != $${paramIndex}
             AND (m.read_status IS NULL OR m.read_status = 'Unread')
          ), 0
        ) as unread_count`;
        values.push(userId);
        paramIndex++;
      } else {
        query += `, 0 as unread_count`;
      }
      
      // For Direct conversations, include participant names (excluding current user)
      // This helps frontend display participant names instead of title
      if (userId) {
        // Use the userId parameter from the outer query ($1 refers to userId in the WHERE clause)
        query += `, (
          SELECT STRING_AGG(e.name || ' ' || e.surname, ', ' ORDER BY e.name)
          FROM Conversation_Participants cp2
          INNER JOIN Employee e ON cp2.employee_id = e.id
          WHERE cp2.conversation_id = c.id
            AND cp2.employee_id != $1
            AND c.type = 'Direct'
        ) as participant_names`;
      } else {
        query += `, NULL as participant_names`;
      }
      
      query += ` FROM ${tableName} c`;
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // Match messagesModel.js exactly - use unquoted table name and lowercase column names
        // PostgreSQL converts unquoted identifiers to lowercase
        // Exclude conversations that the user has deleted (deleted_at IS NULL or deleted_at is not set)
        query += ` INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id WHERE cp.employee_id = $1 AND (cp.deleted_at IS NULL)`;
        
        // Also apply center filter if not App Admin
        if (centerId !== null) {
          query += ` AND c.center_id = $${paramIndex}`;
          values.push(centerId);
        }
      } else if (centerId !== null) {
        // If no userId but centerId exists, filter by center only (fallback)
        query += ` WHERE c.center_id = $1`;
        values.push(centerId);
      }
      // If both are null (App Admin), show all conversations
      
      // PostgreSQL stores unquoted identifiers as lowercase, so Updated_At becomes updated_at
      query += ` ORDER BY c.updated_at DESC`;

      console.log('[DEBUG] Conversations.getAll query:', query);
      console.log('[DEBUG] Conversations.getAll values:', values);
      
      const res = await pool.query(query, values);
      console.log('[DEBUG] Conversations.getAll result count:', res.rows.length);
      
      return res.rows;
    } catch (err) {
      console.error('[ERROR] Conversations.getAll error:', err.message);
      console.error('[ERROR] Conversations.getAll stack:', err.stack);
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
        // Match messagesModel.js exactly - use unquoted table name and lowercase column names
        // Exclude conversations that the user has deleted
        query += ` INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        whereConditions.push(`(cp.deleted_at IS NULL)`);
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
