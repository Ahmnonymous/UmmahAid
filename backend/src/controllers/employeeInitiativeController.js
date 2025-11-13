const employeeInitiativeModel = require('../models/employeeInitiativeModel');

const employeeInitiativeController = {
  getAll: async (req, res) => { 
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const employeeId = req.query.employee_id || req.query.employeeId;
      const tempEmployeeId = employeeId ? parseInt(employeeId, 10) : null;
      const parsedEmployeeId = Number.isNaN(tempEmployeeId) ? null : tempEmployeeId;
      const data = await employeeInitiativeModel.getAll(centerId, isMultiCenter, parsedEmployeeId); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await employeeInitiativeModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      // ✅ Add audit fields
      const username = req.user?.username || 'system';
      fields.created_by = username;
      fields.updated_by = username;
      
      // ✅ Add center_id
      fields.center_id = req.center_id || req.user?.center_id;
      
      const data = await employeeInitiativeModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      // ✅ Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      fields.updated_by = username;
      delete fields.created_by;
      
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await employeeInitiativeModel.update(req.params.id, fields, centerId, isMultiCenter); 
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
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const deleted = await employeeInitiativeModel.delete(req.params.id, centerId, isMultiCenter); 
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = employeeInitiativeController;
