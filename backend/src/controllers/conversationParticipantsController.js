const conversationParticipantsModel = require('../models/conversationParticipantsModel');

const conversationParticipantsController = {
  getAll: async (req, res) => {
    try {
      // ✅ App Admin (center_id=null) sees all, others see only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await conversationParticipantsModel.getAll(centerId);
      res.json(data);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  },
  
  getById: async (req, res) => {
    try {
      // ✅ App Admin (center_id=null) sees all, others see only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await conversationParticipantsModel.getById(req.params.id, centerId);
      if(!data) return res.status(404).json({error: 'Not found'});
      res.json(data);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  },
  
  create: async (req, res) => {
    try {
      // ✅ Map frontend field names to match database column names
      // PostgreSQL stores unquoted identifiers as lowercase, so use lowercase column names
      const mappedFields = {
        ...req.body,
        conversation_id: req.body.conversation_id || req.body.Conversation_ID,
        employee_id: req.body.employee_id || req.body.Employee_ID,
        joined_date: req.body.joined_date || req.body.Joined_Date,
      };
      // Remove capitalized versions if they exist
      delete mappedFields.Conversation_ID;
      delete mappedFields.Employee_ID;
      delete mappedFields.Joined_Date;
      
      const data = await conversationParticipantsModel.create(mappedFields);
      res.status(201).json(data);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  },
  
  update: async (req, res) => {
    try {
      // ✅ App Admin (center_id=null) can update all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await conversationParticipantsModel.update(req.params.id, req.body, centerId);
      if (!data) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(data);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  },
  
  delete: async (req, res) => {
    try {
      // ✅ App Admin (center_id=null) can delete all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const deleted = await conversationParticipantsModel.delete(req.params.id, centerId);
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'});
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  }
};

module.exports = conversationParticipantsController;
