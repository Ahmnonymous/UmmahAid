const financialAssessmentModel = require('../models/financialAssessmentModel');

const financialAssessmentController = {
  getAll: async (req, res) => { 
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      
      // ✅ Support file_id query parameter to filter by applicant
      const fileId = req.query.file_id ? parseInt(req.query.file_id, 10) : null;
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Financial Assessment getAll - fileId:', fileId, 'centerId:', centerId);
      }
      
      let data;
      if (fileId && !isNaN(fileId)) {
        // Get financial assessment for specific applicant
        data = await financialAssessmentModel.getByFileId(fileId, centerId, isMultiCenter);
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('getByFileId result:', data ? { id: data.id, file_id: data.file_id } : 'null');
        }
        
        // Return as array for consistency, or single object if found
        if (data) {
          // Double-check that the returned data matches the requested file_id
          if (data.file_id && parseInt(data.file_id, 10) !== fileId) {
            console.error('Mismatch: requested file_id', fileId, 'but got file_id', data.file_id);
            res.json([]);
            return;
          }
          res.json(Array.isArray(data) ? data : [data]);
        } else {
          res.json([]);
        }
      } else {
        // Get all financial assessments (only if no file_id specified)
        data = await financialAssessmentModel.getAll(centerId, isMultiCenter);
        res.json(data);
      }
    } catch(err){ 
      console.error('Financial Assessment getAll error:', err);
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await financialAssessmentModel.getById(req.params.id, centerId, isMultiCenter); 
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
      
      const data = await financialAssessmentModel.create(fields); 
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
      const data = await financialAssessmentModel.update(req.params.id, fields, centerId, isMultiCenter); 
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
      const deleted = await financialAssessmentModel.delete(req.params.id, centerId, isMultiCenter); 
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = financialAssessmentController;
