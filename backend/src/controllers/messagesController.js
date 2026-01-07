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
  }
};

module.exports = messagesController;
