const foldersModel = require('../models/foldersModel');

const foldersController = {
  getAll: async (req, res) => { 
    try { 
      // ✅ Each user sees only their own folders - filter by created_by (username)
      const username = req.user?.username || null;
      const data = await foldersModel.getAll(username); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      // ✅ Each user sees only their own folders - filter by created_by (username)
      const username = req.user?.username || null;
      const data = await foldersModel.getById(req.params.id, username); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try {
      // ✅ Add audit fields
      const username = req.user?.username || 'system';
      req.body.created_by = username;
      req.body.updated_by = username;
      
      const fields = { ...req.body };
      
      // Clean up empty strings for numeric fields
      if (fields.parent_id === '' || fields.parent_id === 'null' || fields.parent_id === 'undefined') {
        delete fields.parent_id;
      } else if (fields.parent_id) {
        fields.parent_id = parseInt(fields.parent_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
      const data = await foldersModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // ✅ Enforce audit fields and prevent created_by override
      delete fields.created_by;
      fields.updated_by = req.user?.username || 'system';
      
      // Clean up empty strings for numeric fields
      if (fields.parent_id === '' || fields.parent_id === 'null' || fields.parent_id === 'undefined') {
        delete fields.parent_id;
      } else if (fields.parent_id) {
        fields.parent_id = parseInt(fields.parent_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
      // ✅ Each user can only update their own folders - filter by created_by (username)
      const username = req.user?.username || null;
      const data = await foldersModel.update(req.params.id, fields, username); 
      if (!data) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      // ✅ Each user can only delete their own folders - filter by created_by (username)
      const username = req.user?.username || null;
      const deleted = await foldersModel.delete(req.params.id, username); 
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

};

module.exports = foldersController;
