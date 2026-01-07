const conversationsModel = require('../models/conversationsModel');

const conversationsController = {
  getAll: async (req, res) => { 
    try { 
      // ✅ Filter by participant - users only see conversations they're part of
      let centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null; // Get user ID from JWT
      
      // ✅ Normalize centerId: convert to integer or null
      if (centerId !== null && centerId !== undefined) {
        centerId = parseInt(centerId);
        if (isNaN(centerId)) {
          centerId = null; // Invalid number becomes null
        }
      } else {
        centerId = null; // Explicitly set to null
      }
      
      // ✅ Normalize userId: convert to integer or null
      let normalizedUserId = null;
      if (userId !== null && userId !== undefined) {
        normalizedUserId = parseInt(userId);
        if (isNaN(normalizedUserId)) {
          normalizedUserId = null;
        }
      }
      
      const data = await conversationsModel.getAll(centerId, normalizedUserId); 
      res.json(data); 
    } catch(err){ 
      console.error(`[ERROR] Conversations.getAll - ${err.message}`, err);
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      // ✅ Filter by participant - users can only view conversations they're part of
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
      
      const data = await conversationsModel.getById(req.params.id, centerId, normalizedUserId); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      // ✅ Enforce audit fields and tenant context
      const fields = { ...req.body };
      const username = req.user?.username || 'system';
      fields.created_by = fields.created_by || username;
      fields.updated_by = fields.updated_by || username;
      fields.center_id = req.center_id || req.user?.center_id || fields.center_id;
      
      const data = await conversationsModel.create(fields); 
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
      
      // ✅ App Admin (center_id=null) can update all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await conversationsModel.update(req.params.id, fields, centerId); 
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
      // ✅ App Admin (center_id=null) can delete all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const deleted = await conversationsModel.delete(req.params.id, centerId); 
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = conversationsController;
