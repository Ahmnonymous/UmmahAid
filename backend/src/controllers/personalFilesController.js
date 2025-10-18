const personalFilesModel = require('../models/personalFilesModel');
const fs = require('fs').promises;

const personalFilesController = {
  getAll: async (req, res) => { 
    try { 
      const data = await personalFilesModel.getAll(); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await personalFilesModel.getById(req.params.id); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Clean up empty strings for numeric fields
      if (fields.folder_id === '' || fields.folder_id === 'null' || fields.folder_id === 'undefined') {
        delete fields.folder_id;
      } else if (fields.folder_id) {
        fields.folder_id = parseInt(fields.folder_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
      // Handle file upload if present
      if (req.files && req.files.file && req.files.file.length > 0) {
        const file = req.files.file[0];
        const buffer = await fs.readFile(file.path);
        fields.file = buffer;
        fields.file_filename = file.originalname;
        fields.file_mime = file.mimetype;
        fields.file_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await personalFilesModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Personal_Files: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Clean up empty strings for numeric fields
      if (fields.folder_id === '' || fields.folder_id === 'null' || fields.folder_id === 'undefined') {
        delete fields.folder_id;
      } else if (fields.folder_id) {
        fields.folder_id = parseInt(fields.folder_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
      // Handle file upload if present
      if (req.files && req.files.file && req.files.file.length > 0) {
        const file = req.files.file[0];
        const buffer = await fs.readFile(file.path);
        fields.file = buffer;
        fields.file_filename = file.originalname;
        fields.file_mime = file.mimetype;
        fields.file_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await personalFilesModel.update(req.params.id, fields); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Personal_Files: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await personalFilesModel.delete(req.params.id); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewFile: async (req, res) => {
    try {
      const record = await personalFilesModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "file";
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", record.file_size);
  
      let buffer = record.file;
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "base64");
      }
  
      res.end(buffer, "binary");
    } catch (err) {
      res.status(500).json({ error: "Error viewing file: " + err.message });
    }
  },

  downloadFile: async (req, res) => {
    try {
      const record = await personalFilesModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "file";
  
      let buffer = record.file;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown file encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("File buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ error: "Error downloading file: " + err.message });
    }
  }
};

module.exports = personalFilesController;
