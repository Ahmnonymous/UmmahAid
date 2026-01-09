const messagesModel = require('../models/messagesModel');
const fs = require('fs').promises;

const messagesController = {
  getAll: async (req, res) => { 
    try { 
      // ✅ Filter by participant - users only see messages from conversations they're part of
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null; // Get user ID from JWT
      const conversationId = req.query?.conversation_id || null; // Optional conversation filter
      
      // ✅ Normalize userId: convert to integer or null
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      // ✅ Normalize conversationId: convert to integer or null
      let normalizedConversationId = null;
      if (conversationId !== null && conversationId !== undefined) {
        normalizedConversationId = parseInt(conversationId);
        if (isNaN(normalizedConversationId)) {
          normalizedConversationId = null;
        }
      }
      
      const data = await messagesModel.getAll(centerId, normalizedUserId, normalizedConversationId); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      // ✅ Filter by participant - users can only view messages from conversations they're part of
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null;
      
      // Normalize userId
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      const data = await messagesModel.getById(req.params.id, centerId, normalizedUserId); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      // ✅ Enforce audit fields and tenant context
      const username = req.user?.username || 'system';
      fields.created_by = fields.created_by || username;
      fields.updated_by = fields.updated_by || username;
      fields.center_id = req.center_id || req.user?.center_id || fields.center_id;
      
      // Handle file upload if present
      if (req.files && req.files.attachment && req.files.attachment.length > 0) {
        const file = req.files.attachment[0];
        const buffer = await fs.readFile(file.path);
        fields.attachment = buffer;
        fields.attachment_filename = file.originalname;
        fields.attachment_mime = file.mimetype;
        fields.attachment_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await messagesModel.create(fields);
      
      // ✅ Restore conversation for all participants if it was deleted
      // When a new message arrives, restore the conversation for all participants (including sender)
      // This ensures deleted conversations reappear when new messages arrive
      // IMPORTANT: Set last_restored_at to the message's created_at (or slightly before) so the new message is always shown
      if (data && data.conversation_id && data.created_at) {
        try {
          const conversationParticipantsModel = require('../models/conversationParticipantsModel');
          // Get all participants for this conversation
          const pool = require('../config/db');
          const participantsRes = await pool.query(
            'SELECT employee_id FROM Conversation_Participants WHERE conversation_id = $1',
            [data.conversation_id]
          );
          
          // Restore conversation for ALL participants (including sender)
          // Pass the message's created_at timestamp so last_restored_at is set to that time (or slightly before)
          // This ensures the new message is always included in the filtered results
          console.log(`[DEBUG] Restoring conversation ${data.conversation_id} for ${participantsRes.rows.length} participants`);
          console.log(`[DEBUG] Message created_at:`, data.created_at, typeof data.created_at);
          
          // Use the message's created_at timestamp - set last_restored_at to 1 second before
          // This ensures the new message is always included since we use >= comparison
          // Using 1 second buffer accounts for any timestamp precision or timezone issues
          const messageCreatedAt = data.created_at ? new Date(data.created_at) : new Date();
          // Set to 1 second before to ensure message is definitely included
          const restoreTimestamp = new Date(messageCreatedAt.getTime() - 1000);
          console.log(`[DEBUG] Message created_at (Date):`, messageCreatedAt.toISOString());
          console.log(`[DEBUG] Setting last_restored_at to:`, restoreTimestamp.toISOString());
          console.log(`[DEBUG] Time difference (ms):`, messageCreatedAt.getTime() - restoreTimestamp.getTime());
          
          // Verify the timestamp is definitely before the message
          if (restoreTimestamp >= messageCreatedAt) {
            console.error(`[ERROR] restoreTimestamp is NOT before messageCreatedAt!`);
            // Force it to be 1 second before
            const forcedTimestamp = new Date(messageCreatedAt.getTime() - 1000);
            console.log(`[DEBUG] Using forced timestamp:`, forcedTimestamp.toISOString());
          }
          
          for (const participant of participantsRes.rows) {
            const participantId = parseInt(participant.employee_id);
            const restored = await conversationParticipantsModel.restoreConversationForUser(
              data.conversation_id,
              participantId,
              restoreTimestamp
            );
            console.log(`[DEBUG] Restored conversation for participant ${participantId}:`, restored ? 'Success' : 'No update needed');
            if (restored && restored.last_restored_at) {
              console.log(`[DEBUG] Participant ${participantId} last_restored_at:`, restored.last_restored_at);
            }
          }
          
          // Also update the conversation's updated_at timestamp so it appears at the top of the list
          const updateRes = await pool.query(
            'UPDATE Conversations SET updated_at = NOW() WHERE id = $1 RETURNING id, updated_at',
            [data.conversation_id]
          );
          console.log(`[DEBUG] Updated conversation ${data.conversation_id} updated_at:`, updateRes.rows[0]?.updated_at);
        } catch (restoreErr) {
          // Log but don't fail the message creation
          console.error('Error restoring conversation for participants:', restoreErr);
        }
      }
      
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Messages: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      // ✅ Enforce audit fields and prevent created_by override
      delete fields.created_by;
      fields.updated_by = req.user?.username || 'system';
      fields.center_id = req.center_id || req.user?.center_id || fields.center_id;
      
      // Handle file upload if present
      if (req.files && req.files.attachment && req.files.attachment.length > 0) {
        const file = req.files.attachment[0];
        const buffer = await fs.readFile(file.path);
        fields.attachment = buffer;
        fields.attachment_filename = file.originalname;
        fields.attachment_mime = file.mimetype;
        fields.attachment_size = file.size;
        await fs.unlink(file.path);
      }
      
      // ✅ Filter by participant - users can only update messages from conversations they're part of
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null;
      
      // Normalize userId
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      const data = await messagesModel.update(req.params.id, fields, centerId, normalizedUserId); 
      if (!data) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Messages: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      // ✅ Filter by participant - users can only delete messages from conversations they're part of
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null;
      
      // Normalize userId
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      const deleted = await messagesModel.delete(req.params.id, centerId, normalizedUserId); 
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewAttachment: async (req, res) => {
    try {
      // ✅ Filter by participant - users can only view attachments from conversations they're part of
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null;
      
      // Normalize userId
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      const record = await messagesModel.getRawAttachment(req.params.id, centerId, normalizedUserId);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_mime || "application/octet-stream";
      const filename = record.attachment_filename || "attachment";
  
      // Get the raw buffer (PostgreSQL returns bytea as Buffer)
      let buffer = record.attachment;
      
      // Ensure it's a Buffer
      if (!Buffer.isBuffer(buffer)) {
        if (typeof buffer === "string") {
          if (buffer.startsWith("\\x")) {
            buffer = Buffer.from(buffer.slice(2), "hex");
          } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
            buffer = Buffer.from(buffer, "base64");
          } else {
            throw new Error("Unknown attachment encoding");
          }
        } else {
          throw new Error("Invalid attachment data type");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Attachment buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing attachment:", err);
      res.status(500).json({ error: "Error viewing attachment: " + err.message });
    }
  },

  downloadAttachment: async (req, res) => {
    try {
      // ✅ Filter by participant - users can only download attachments from conversations they're part of
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null;
      
      // Normalize userId
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      const record = await messagesModel.getRawAttachment(req.params.id, centerId, normalizedUserId);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment) return res.status(404).send("No attachment found");

      const mimeType = record.attachment_mime || "application/octet-stream";
      const filename = record.attachment_filename || "attachment";

      // Get the raw buffer (PostgreSQL returns bytea as Buffer)
      let buffer = record.attachment;
      
      // Ensure it's a Buffer
      if (!Buffer.isBuffer(buffer)) {
        if (typeof buffer === "string") {
          if (buffer.startsWith("\\x")) {
            buffer = Buffer.from(buffer.slice(2), "hex");
          } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
            buffer = Buffer.from(buffer, "base64");
          } else {
            throw new Error("Unknown attachment encoding");
          }
        } else {
          throw new Error("Invalid attachment data type");
        }
      }

      if (!buffer || !buffer.length) {
        return res.status(500).send("Attachment buffer is empty or corrupted");
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);

      res.end(buffer);
    } catch (err) {
      console.error("Error downloading attachment:", err);
      res.status(500).json({ error: "Error downloading attachment: " + err.message });
    }
  },

  markConversationAsRead: async (req, res) => {
    try {
      const conversationId = req.params.conversationId || req.params.id;
      const centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null;
      
      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required" });
      }
      
      // Normalize userId
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          return res.status(400).json({ error: "Invalid user ID" });
        }
      } else {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Normalize conversationId
      const normalizedConversationId = parseInt(conversationId);
      if (isNaN(normalizedConversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const count = await messagesModel.markConversationAsRead(
        normalizedConversationId,
        normalizedUserId,
        centerId
      );
      
      res.json({ 
        success: true, 
        message: `Marked ${count} messages as read`,
        count 
      });
    } catch (err) {
      console.error("Error marking conversation as read:", err);
      res.status(500).json({ error: "Error marking conversation as read: " + err.message });
    }
  }
};

module.exports = messagesController;
