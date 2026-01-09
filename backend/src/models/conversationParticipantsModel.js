const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
} = require("../utils/modelHelpers");

const tableName = "Conversation_Participants";

const conversationParticipantsModel = {
  getAll: async (centerId = null) => {
    try {
      const scoped = scopeQuery(`SELECT * FROM ${tableName}`, {
        centerId,
        isSuperAdmin: centerId === null,
        column: "center_id",
        enforce: centerId !== null,
      });

      const res = await pool.query(scoped.text, scoped.values);
      return res.rows;
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  getById: async (id, centerId = null) => {
    try {
      const scoped = scopeQuery(
        {
          text: `SELECT * FROM ${tableName} WHERE "id" = $1`,
          values: [id],
        },
        {
          centerId,
          isSuperAdmin: centerId === null,
          column: "center_id",
          enforce: centerId !== null,
        },
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
      const { columns, values, placeholders } = buildInsertFragments(fields);
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error(`Error creating record in ${tableName}: ${err.message}`);
    }
  },

  update: async (id, fields, centerId = null) => {
    const existing = await conversationParticipantsModel.getById(
      id,
      centerId,
    );
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
    const existing = await conversationParticipantsModel.getById(
      id,
      centerId,
    );
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

  // Mark conversation as deleted for a specific user (soft delete)
  markConversationDeletedForUser: async (conversationId, userId, centerId = null) => {
    try {
      // Find the participant record - PostgreSQL converts unquoted identifiers to lowercase
      let query = `
        SELECT cp.* FROM ${tableName} cp
        WHERE cp.conversation_id = $1 AND cp.employee_id = $2
      `;
      const values = [conversationId, userId];
      
      if (centerId !== null) {
        query += ` AND cp.center_id = $3`;
        values.push(centerId);
      }
      
      const findRes = await pool.query(query, values);
      if (!findRes.rows[0]) {
        return null; // User is not a participant
      }
      
      // Update to set deleted_at timestamp
      // PostgreSQL converts unquoted identifiers to lowercase
      const updateQuery = `
        UPDATE ${tableName} 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE conversation_id = $1 AND employee_id = $2
        RETURNING *
      `;
      const updateValues = [conversationId, userId];
      
      if (centerId !== null) {
        const updateQueryWithCenter = `
          UPDATE ${tableName} 
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE conversation_id = $1 AND employee_id = $2 AND center_id = $3
          RETURNING *
        `;
        const updateValuesWithCenter = [conversationId, userId, centerId];
        const updateRes = await pool.query(updateQueryWithCenter, updateValuesWithCenter);
        return updateRes.rows[0] || null;
      }
      
      const updateRes = await pool.query(updateQuery, updateValues);
      return updateRes.rows[0] || null;
    } catch (err) {
      throw new Error(
        `Error marking conversation as deleted for user in ${tableName}: ${err.message}`,
      );
    }
  },

  // Restore conversation for a user (remove deleted_at when new message arrives)
  // Sets last_restored_at to track when conversation was restored (for filtering old messages)
  // Only sets last_restored_at if the conversation was actually deleted (deleted_at IS NOT NULL)
  // This ensures that conversations that were never deleted still show all messages
  // restoreTimestamp: optional timestamp to use for last_restored_at (defaults to NOW())
  // If provided, should be slightly before the new message's created_at to ensure the message is shown
  restoreConversationForUser: async (conversationId, userId, restoreTimestamp = null) => {
    try {
      // Check if deleted_at and last_restored_at columns exist
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'conversation_participants' 
          AND column_name IN ('deleted_at', 'last_restored_at')
      `);
      const hasDeletedAt = columnCheck.rows.some(r => r.column_name === 'deleted_at');
      const hasLastRestoredAt = columnCheck.rows.some(r => r.column_name === 'last_restored_at');
      
      // First, check if the conversation was actually deleted
      let wasDeleted = false;
      let currentLastRestoredAt = null;
      if (hasDeletedAt || hasLastRestoredAt) {
        const checkQuery = `SELECT deleted_at${hasLastRestoredAt ? ', last_restored_at' : ''} FROM ${tableName} WHERE conversation_id = $1 AND employee_id = $2`;
        const checkRes = await pool.query(checkQuery, [conversationId, userId]);
        wasDeleted = hasDeletedAt && checkRes.rows[0]?.deleted_at !== null;
        currentLastRestoredAt = hasLastRestoredAt ? checkRes.rows[0]?.last_restored_at : null;
        console.log(`[DEBUG] Conversation ${conversationId} for user ${userId}: wasDeleted=${wasDeleted}, currentLastRestoredAt=${currentLastRestoredAt}`);
      }
      
      // Build SET clause based on which columns exist
      // Only set last_restored_at if the conversation was actually deleted (WhatsApp-like behavior)
      let setClause = 'updated_at = NOW()';
      const values = [conversationId, userId];
      let paramIndex = 3;
      
      if (hasDeletedAt) {
        setClause = `deleted_at = NULL, ${setClause}`;
      }
      if (hasLastRestoredAt) {
        // WhatsApp-like behavior for last_restored_at:
        // ONLY update last_restored_at if the conversation was actually deleted (wasDeleted = true)
        // If conversation was not deleted, NEVER touch last_restored_at (preserve its current value)
        // This ensures that:
        // - If user deleted conversation: last_restored_at is set to hide old messages
        // - If user never deleted: last_restored_at stays NULL (show all messages)
        // - If user previously deleted and restored: last_restored_at stays set (old messages stay hidden)
        if (wasDeleted) {
          // Conversation was deleted - set last_restored_at to hide old messages
          // Use provided restoreTimestamp (should be message's created_at minus 1 second)
          if (restoreTimestamp) {
            // Ensure we're using a Date object
            const timestampValue = restoreTimestamp instanceof Date ? restoreTimestamp : new Date(restoreTimestamp);
            setClause = `${setClause}, last_restored_at = $${paramIndex}`;
            values.push(timestampValue);
            paramIndex++;
            console.log(`[DEBUG] Setting last_restored_at to (was deleted):`, timestampValue.toISOString());
          } else {
            setClause = `${setClause}, last_restored_at = NOW()`;
            console.log(`[DEBUG] Setting last_restored_at to NOW() (no timestamp provided)`);
          }
        } else {
          // Conversation was NOT deleted - DO NOT update last_restored_at at all
          // This preserves:
          // - NULL value (if never deleted) = show all messages
          // - Existing timestamp (if previously restored) = keep old messages hidden
          console.log(`[DEBUG] NOT updating last_restored_at (conversation not deleted). Current value:`, currentLastRestoredAt);
          // Don't include last_restored_at in SET clause - leave it unchanged
        }
      }
      
      // PostgreSQL converts unquoted identifiers to lowercase
      // Remove deleted_at to make conversation visible again
      const query = `
        UPDATE ${tableName} 
        SET ${setClause}
        WHERE conversation_id = $1 AND employee_id = $2
        RETURNING *
      `;
      const res = await pool.query(query, values);
      return res.rows[0] || null;
    } catch (err) {
      throw new Error(
        `Error restoring conversation for user in ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = conversationParticipantsModel;
