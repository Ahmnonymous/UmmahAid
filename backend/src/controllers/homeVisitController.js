﻿const homeVisitModel = require('../models/homeVisitModel');
const fs = require('fs').promises;

const homeVisitController = {
  getAll: async (req, res) => { 
    try { 
      const data = await homeVisitModel.getAll(); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await homeVisitModel.getById(req.params.id); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Handle file uploads if present
      if (req.files) {
        if (req.files.attachment_1 && req.files.attachment_1.length > 0) {
          const file = req.files.attachment_1[0];
          const buffer = await fs.readFile(file.path);
          fields.attachment_1 = buffer;
          fields.attachment_1_filename = file.originalname;
          fields.attachment_1_mime = file.mimetype;
          fields.attachment_1_size = file.size;
          await fs.unlink(file.path);
        }
        
        if (req.files.attachment_2 && req.files.attachment_2.length > 0) {
          const file = req.files.attachment_2[0];
          const buffer = await fs.readFile(file.path);
          fields.attachment_2 = buffer;
          fields.attachment_2_filename = file.originalname;
          fields.attachment_2_mime = file.mimetype;
          fields.attachment_2_size = file.size;
          await fs.unlink(file.path);
        }
      }
      
      const data = await homeVisitModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Home_Visit: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Handle file uploads if present
      if (req.files) {
        if (req.files.attachment_1 && req.files.attachment_1.length > 0) {
          const file = req.files.attachment_1[0];
          const buffer = await fs.readFile(file.path);
          fields.attachment_1 = buffer;
          fields.attachment_1_filename = file.originalname;
          fields.attachment_1_mime = file.mimetype;
          fields.attachment_1_size = file.size;
          await fs.unlink(file.path);
        }
        
        if (req.files.attachment_2 && req.files.attachment_2.length > 0) {
          const file = req.files.attachment_2[0];
          const buffer = await fs.readFile(file.path);
          fields.attachment_2 = buffer;
          fields.attachment_2_filename = file.originalname;
          fields.attachment_2_mime = file.mimetype;
          fields.attachment_2_size = file.size;
          await fs.unlink(file.path);
        }
      }
      
      const data = await homeVisitModel.update(req.params.id, fields); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Home_Visit: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await homeVisitModel.delete(req.params.id); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewAttachment1: async (req, res) => {
    try {
      const record = await homeVisitModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment_1) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_1_mime || "application/octet-stream";
      const filename = record.attachment_1_filename || "attachment_1";
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", record.attachment_1_size);
  
      let buffer = record.attachment_1;
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "base64");
      }
  
      res.end(buffer, "binary");
    } catch (err) {
      res.status(500).json({ error: "Error viewing attachment: " + err.message });
    }
  },

  downloadAttachment1: async (req, res) => {
    try {
      const record = await homeVisitModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment_1) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_1_mime || "application/octet-stream";
      const filename = record.attachment_1_filename || "attachment_1";
  
      let buffer = record.attachment_1;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown attachment encoding");
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

  viewAttachment2: async (req, res) => {
    try {
      const record = await homeVisitModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment_2) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_2_mime || "application/octet-stream";
      const filename = record.attachment_2_filename || "attachment_2";
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", record.attachment_2_size);
  
      let buffer = record.attachment_2;
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "base64");
      }
  
      res.end(buffer, "binary");
    } catch (err) {
      res.status(500).json({ error: "Error viewing attachment: " + err.message });
    }
  },

  downloadAttachment2: async (req, res) => {
    try {
      const record = await homeVisitModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment_2) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_2_mime || "application/octet-stream";
      const filename = record.attachment_2_filename || "attachment_2";
  
      let buffer = record.attachment_2;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown attachment encoding");
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

module.exports = homeVisitController;
