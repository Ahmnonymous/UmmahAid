const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Messages";

const normalizeAttachments = (records = []) =>
  records.map((record) => {
    const clone = { ...record };
    if (clone.attachment && clone.attachment_filename) {
      clone.attachment = "exists";
    } else if (clone.attachment && typeof clone.attachment !== "string") {
      clone.attachment = clone.attachment.toString("base64");
    }
    return clone;
  });

const messagesModel = {
  getAll: async (centerId = null, userId = null, conversationId = null) => {
    try {
      // ✅ Filter by participant - users only see messages from conversations they're part of
      let query = `SELECT DISTINCT m.* FROM ${tableName} m`;
      const values = [];
      let whereConditions = [];
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // PostgreSQL stores unquoted identifiers as lowercase, so Conversation_ID becomes conversation_id
        query += ` INNER JOIN Conversations c ON m.conversation_id = c.id 
                   INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        values.push(userId);
      }
      
      // Filter by specific conversation if provided
      if (conversationId) {
        whereConditions.push(`m.conversation_id = $${values.length + 1}`);
        values.push(conversationId);
      }
      
      // Apply center filter if not App Admin and no userId (fallback)
      if (centerId !== null && !userId) {
        whereConditions.push(`m.center_id = $${values.length + 1}`);
        values.push(centerId);
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY m.created_at ASC`;

      const res = await pool.query(query, values);
      return normalizeAttachments(res.rows);
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, centerId = null, userId = null) => {
    try {
      // ✅ Filter by participant - users can only view messages from conversations they're part of
      let query = `SELECT m.* FROM ${tableName} m`;
      const values = [id];
      let whereConditions = [`m.id = $1`];
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // PostgreSQL stores unquoted identifiers as lowercase
        query += ` INNER JOIN Conversations c ON m.conversation_id = c.id 
                   INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        values.push(userId);
      } else if (centerId !== null) {
        // Fallback to center filter if no userId
        whereConditions.push(`m.center_id = $${values.length + 1}`);
        values.push(centerId);
      }
      
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      
      const res = await pool.query(query, values);
      if (!res.rows[0]) return null;
      return normalizeAttachments(res.rows)[0];
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
      return normalizeAttachments(res.rows)[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null, userId = null) => {
    const existing = await messagesModel.getById(id, centerId, userId);
    if (!existing) {
      return null;
    }

    try {
      const { setClause, values } = buildUpdateFragments(fields);
      const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${
        values.length + 1
      } RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return normalizeAttachments(res.rows)[0];
    } catch (err) {
      throw new Error(`Error updating record in ${tableName}: ${err.message}`);
    }
  },

  delete: async (id, centerId = null, userId = null) => {
    const existing = await messagesModel.getById(id, centerId, userId);
    if (!existing) {
      return null;
    }

    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return normalizeAttachments(res.rows)[0];
    } catch (err) {
      throw new Error(
        `Error deleting record from ${tableName}: ${err.message}`,
      );
    }
  },

  // Get raw attachment data without normalization (for viewing/downloading)
  getRawAttachment: async (id, centerId = null, userId = null) => {
    try {
      // ✅ Filter by participant - users can only view attachments from conversations they're part of
      let query = `SELECT m.attachment, m.attachment_filename, m.attachment_mime, m.attachment_size FROM ${tableName} m`;
      const values = [id];
      let whereConditions = [`m.id = $1`];
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // PostgreSQL stores unquoted identifiers as lowercase
        query += ` INNER JOIN Conversations c ON m.conversation_id = c.id 
                   INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        values.push(userId);
      } else if (centerId !== null) {
        // Fallback to center filter if no userId
        whereConditions.push(`m.center_id = $${values.length + 1}`);
        values.push(centerId);
      }
      
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      
      const res = await pool.query(query, values);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error(
        `Error fetching raw attachment from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = messagesModel;
