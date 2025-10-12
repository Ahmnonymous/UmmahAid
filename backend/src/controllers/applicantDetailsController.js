const applicantDetailsModel = require('../models/applicantDetailsModel');
const fs = require('fs').promises;

const applicantDetailsController = {
  getAll: async (req, res) => { 
    try { 
      const data = await applicantDetailsModel.getAll(); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await applicantDetailsModel.getById(req.params.id); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Handle file upload if present (signature)
      if (req.files && req.files.signature && req.files.signature.length > 0) {
        const file = req.files.signature[0];
        const buffer = await fs.readFile(file.path);
        fields.signature = buffer;
        fields.signature_filename = file.originalname;
        fields.signature_mime = file.mimetype;
        fields.signature_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await applicantDetailsModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Applicant_Details: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Handle file upload if present (signature)
      if (req.files && req.files.signature && req.files.signature.length > 0) {
        const file = req.files.signature[0];
        const buffer = await fs.readFile(file.path);
        fields.signature = buffer;
        fields.signature_filename = file.originalname;
        fields.signature_mime = file.mimetype;
        fields.signature_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await applicantDetailsModel.update(req.params.id, fields); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Applicant_Details: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await applicantDetailsModel.delete(req.params.id); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewSignature: async (req, res) => {
    try {
      const record = await applicantDetailsModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.signature) return res.status(404).send("No signature found");
  
      const mimeType = record.signature_mime || "image/png";
      const filename = record.signature_filename || "signature";
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", record.signature_size);
  
      let buffer = record.signature;
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "base64");
      }
  
      res.end(buffer, "binary");
    } catch (err) {
      res.status(500).json({ error: "Error viewing signature: " + err.message });
    }
  },

  downloadSignature: async (req, res) => {
    try {
      const record = await applicantDetailsModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.signature) return res.status(404).send("No signature found");
  
      const mimeType = record.signature_mime || "image/png";
      const filename = record.signature_filename || "signature";
  
      let buffer = record.signature;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown signature encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Signature buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading signature:", err);
      res.status(500).json({ error: "Error downloading signature: " + err.message });
    }
  }
};

module.exports = applicantDetailsController;
