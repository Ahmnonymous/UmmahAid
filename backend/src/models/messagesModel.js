const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Messages";

// Cache for column existence check
let lastRestoredAtColumnExists = null;

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

// Check if last_restored_at column exists in Conversation_Participants table
const checkLastRestoredAtColumnExists = async () => {
  if (lastRestoredAtColumnExists !== null) {
    return lastRestoredAtColumnExists;
  }
  
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversation_participants' 
        AND column_name = 'last_restored_at'
    `);
    lastRestoredAtColumnExists = result.rows.length > 0;
    return lastRestoredAtColumnExists;
  } catch (err) {
    // If check fails, assume column doesn't exist (safe fallback)
    lastRestoredAtColumnExists = false;
    return false;
  }
};

const messagesModel = {
  getAll: async (centerId = null, userId = null, conversationId = null) => {
    try {
      // Check if Message_Read_Status table exists (for per-participant read tracking)
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'message_read_status'
        )
      `);
      const usePerParticipantTracking = tableExists.rows[0].exists;
      
      // ✅ Filter by participant - users only see messages from conversations they're part of
      // For Group/Announcement conversations, also check if all participants have read the message
      let query = `SELECT DISTINCT m.*`;
      
      // Add field to check if all participants have read (for Group/Announcement conversations)
      if (usePerParticipantTracking) {
        query += `, 
          CASE 
            WHEN c.type IN ('Group', 'Announcement') THEN
              (
                SELECT COUNT(*) = 0
                FROM Conversation_Participants cp_all
                WHERE cp_all.conversation_id = c.id
                  AND cp_all.employee_id != m.sender_id
                  -- Only check participants who were in the conversation when the message was sent
                  -- They must have joined before or on the day the message was sent
                  AND (cp_all.joined_date <= m.created_at::DATE)
                  -- They must not have left before the message was sent
                  -- (deleted_at IS NULL means still in conversation, OR deleted_at > created_at means left after message was sent)
                  AND (cp_all.deleted_at IS NULL OR cp_all.deleted_at > m.created_at)
                  -- Check if they haven't read the message yet
                  AND NOT EXISTS (
                    SELECT 1 FROM Message_Read_Status mrs
                    WHERE mrs.Message_ID = m.id 
                      AND mrs.Employee_ID = cp_all.employee_id
                  )
              )
            ELSE
              -- For Direct conversations: check if the other participant has read
              -- Only check if they were in the conversation when the message was sent
              (
                SELECT COUNT(*) > 0
                FROM Conversation_Participants cp_direct
                WHERE cp_direct.conversation_id = c.id
                  AND cp_direct.employee_id != m.sender_id
                  -- Only check participants who were in the conversation when the message was sent
                  AND (cp_direct.joined_date <= m.created_at::DATE)
                  AND (cp_direct.deleted_at IS NULL OR cp_direct.deleted_at > m.created_at)
                  -- Check if they have read the message
                  AND EXISTS (
                    SELECT 1 FROM Message_Read_Status mrs
                    WHERE mrs.Message_ID = m.id 
                      AND mrs.Employee_ID = cp_direct.employee_id
                  )
              )
          END as all_read_by_participants`;
      } else {
        // Fallback to legacy read_status for Direct conversations
        query += `, 
          CASE 
            WHEN c.type IN ('Group', 'Announcement') THEN false
            ELSE (m.read_status = 'Read')
          END as all_read_by_participants`;
      }
      
      query += ` FROM ${tableName} m`;
      const values = [];
      let whereConditions = [];
      
      // Check if last_restored_at column exists (for WhatsApp-like behavior)
      const hasLastRestoredAtColumn = await checkLastRestoredAtColumnExists();
      
      if (userId) {
        // Join with Conversations to get conversation type
        query += ` INNER JOIN Conversations c ON m.conversation_id = c.id 
                   INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        values.push(userId);
        
        // ✅ Only show messages created after conversation was last restored (like WhatsApp)
        // If last_restored_at IS NULL, show all messages (conversation was never deleted)
        // If last_restored_at IS NOT NULL, only show messages after that timestamp
        // Only add this filter if the column exists (graceful handling if migration not run yet)
        if (hasLastRestoredAtColumn) {
          // Show all messages if last_restored_at is NULL (never deleted)
          // Show only messages after restoration if last_restored_at is set (was deleted and restored)
          // Use >= to include messages created at or after the restoration time
          // Note: last_restored_at is set to slightly before message creation to ensure new messages are shown
          whereConditions.push(`(cp.last_restored_at IS NULL OR m.created_at >= cp.last_restored_at)`);
        }
      } else {
        // Still need Conversations table for conversation type
        query += ` INNER JOIN Conversations c ON m.conversation_id = c.id`;
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

      console.log('[DEBUG] Messages.getAll query:', query);
      console.log('[DEBUG] Messages.getAll values:', values);
      const res = await pool.query(query, values);
      console.log('[DEBUG] Messages.getAll result count:', res.rows.length);
      
      // Debug: Log first few messages with their created_at and check filtering
      if (res.rows.length > 0 && conversationId && userId) {
        // Also check the last_restored_at value for this user
        const checkRestoredQuery = `
          SELECT last_restored_at, deleted_at 
          FROM Conversation_Participants 
          WHERE conversation_id = $1 AND employee_id = $2
        `;
        const restoredRes = await pool.query(checkRestoredQuery, [conversationId, userId]);
        console.log('[DEBUG] User participant info:', {
          last_restored_at: restoredRes.rows[0]?.last_restored_at,
          deleted_at: restoredRes.rows[0]?.deleted_at,
          message_count: res.rows.length
        });
        console.log('[DEBUG] Sample messages:', res.rows.slice(0, 3).map(m => ({
          id: m.id,
          created_at: m.created_at,
          message_text: m.message_text?.substring(0, 50)
        })));
      }
      
      // Debug: If no messages returned but conversationId is provided, check what's in the database
      if (res.rows.length === 0 && conversationId && userId) {
        const debugQuery = `
          SELECT m.id, m.created_at, m.message_text, cp.last_restored_at, cp.deleted_at,
                 (m.created_at >= cp.last_restored_at OR cp.last_restored_at IS NULL) as passes_filter
          FROM ${tableName} m
          INNER JOIN Conversations c ON m.conversation_id = c.id 
          INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id
          WHERE m.conversation_id = $1 AND cp.employee_id = $2
          ORDER BY m.created_at DESC
          LIMIT 5
        `;
        const debugRes = await pool.query(debugQuery, [conversationId, userId]);
        console.log('[DEBUG] All messages in DB for this conversation (unfiltered):', debugRes.rows.map(m => {
          const msgCreatedAt = new Date(m.created_at);
          const lastRestored = m.last_restored_at ? new Date(m.last_restored_at) : null;
          const timeDiff = lastRestored ? (msgCreatedAt.getTime() - lastRestored.getTime()) : null;
          return {
            id: m.id,
            created_at: m.created_at,
            last_restored_at: m.last_restored_at,
            deleted_at: m.deleted_at,
            message_text: m.message_text?.substring(0, 50),
            would_show: !lastRestored || msgCreatedAt >= lastRestored,
            passes_filter_db: m.passes_filter,
            time_diff_ms: timeDiff,
            time_diff_sec: timeDiff ? (timeDiff / 1000).toFixed(2) : null
          };
        }));
      }
      
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
      
      // Check if last_restored_at column exists (for WhatsApp-like behavior)
      const hasLastRestoredAtColumn = await checkLastRestoredAtColumnExists();
      
      if (userId) {
        // Join with Conversation_Participants to filter by user participation
        // PostgreSQL stores unquoted identifiers as lowercase
        query += ` INNER JOIN Conversations c ON m.conversation_id = c.id 
                   INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id`;
        whereConditions.push(`cp.employee_id = $${values.length + 1}`);
        values.push(userId);
        
        // ✅ Only show messages created after conversation was last restored (like WhatsApp)
        // Only add this filter if the column exists (graceful handling if migration not run yet)
        if (hasLastRestoredAtColumn) {
          whereConditions.push(`(cp.last_restored_at IS NULL OR m.created_at >= cp.last_restored_at)`);
        }
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

  // Mark all messages in a conversation as read for a specific user
  // Uses per-participant read tracking via Message_Read_Status table
  markConversationAsRead: async (conversationId, userId, centerId = null) => {
    try {
      // Check if Message_Read_Status table exists (graceful handling if migration not run)
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'message_read_status'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        // Fallback to old method if table doesn't exist yet
        return await messagesModel._markConversationAsReadLegacy(conversationId, userId, centerId);
      }
      
      // ✅ Use per-participant read tracking
      // Get all unread messages in the conversation that the user hasn't read yet
      // Only mark messages that are not sent by the user (don't mark own messages)
      let query = `
        INSERT INTO Message_Read_Status (Message_ID, Employee_ID, Created_By, Updated_By)
        SELECT m.id, $1, 'system', 'system'
        FROM ${tableName} m
        INNER JOIN Conversations c ON m.conversation_id = c.id
        INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id
        WHERE m.conversation_id = $2
          AND cp.employee_id = $1
          AND m.sender_id != $1
          AND NOT EXISTS (
            SELECT 1 FROM Message_Read_Status mrs
            WHERE mrs.Message_ID = m.id AND mrs.Employee_ID = $1
          )
      `;
      const values = [userId, conversationId];
      
      // Add center filter if not App Admin
      // IMPORTANT: Include conversations where center_id IS NULL (created by App Admin/HQ)
      // so that Org Admin/Caseworker can mark messages as read in conversations initiated by App Admin/HQ
      if (centerId !== null) {
        query += ` AND (c.center_id = $3 OR c.center_id IS NULL)`;
        values.push(centerId);
      }
      
      query += ` ON CONFLICT (Message_ID, Employee_ID) DO NOTHING`;
      
      const res = await pool.query(query, values);
      
      // Also update the legacy read_status field for backward compatibility
      // This ensures existing code that checks read_status still works
      await messagesModel._markConversationAsReadLegacy(conversationId, userId, centerId);
      
      // Return the number of messages marked as read
      // We get the count by querying how many messages now have read status for this user
      let countQuery = `
        SELECT COUNT(*) as count
        FROM ${tableName} m
        INNER JOIN Conversations c ON m.conversation_id = c.id
        INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id
        INNER JOIN Message_Read_Status mrs ON m.id = mrs.Message_ID AND mrs.Employee_ID = $1
        WHERE m.conversation_id = $2
          AND cp.employee_id = $1
          AND m.sender_id != $1
      `;
      const countValues = [userId, conversationId];
      if (centerId !== null) {
        countQuery += ` AND (c.center_id = $3 OR c.center_id IS NULL)`;
        countValues.push(centerId);
      }
      const countRes = await pool.query(countQuery, countValues);
      
      return parseInt(countRes.rows[0].count) || 0;
    } catch (err) {
      throw new Error(
        `Error marking conversation as read in ${tableName}: ${err.message}`,
      );
    }
  },

  // Legacy method: Update global read_status field (for backward compatibility)
  _markConversationAsReadLegacy: async (conversationId, userId, centerId = null) => {
    try {
      // ✅ Only mark messages as read if user is a participant
      // Only mark messages that are not sent by the user (don't mark own messages)
      // PostgreSQL converts unquoted identifiers to lowercase
      let query = `
        UPDATE ${tableName} m
        SET read_status = 'Read', updated_at = NOW()
        FROM Conversations c
        INNER JOIN Conversation_Participants cp ON c.id = cp.conversation_id
        WHERE m.conversation_id = c.id
          AND c.id = $1
          AND cp.employee_id = $2
          AND m.sender_id != $2
          AND (m.read_status IS NULL OR m.read_status = 'Unread')
      `;
      const values = [conversationId, userId];
      
      // Add center filter if not App Admin
      // IMPORTANT: Include conversations where center_id IS NULL (created by App Admin/HQ)
      // so that Org Admin/Caseworker can mark messages as read in conversations initiated by App Admin/HQ
      if (centerId !== null) {
        query += ` AND (c.center_id = $3 OR c.center_id IS NULL)`;
        values.push(centerId);
      }
      
      const res = await pool.query(query, values);
      return res.rowCount; // Return number of messages marked as read
    } catch (err) {
      throw new Error(
        `Error marking conversation as read (legacy) in ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = messagesModel;
