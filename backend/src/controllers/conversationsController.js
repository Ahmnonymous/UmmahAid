const conversationsModel = require('../models/conversationsModel');

const conversationsController = {
  getAll: async (req, res) => { 
    try { 
      // ✅ Filter by participant - users only see conversations they're part of
      let centerId = req.center_id || req.user?.center_id || null;
      const userId = req.user?.id || null; // Get user ID from JWT
      
      console.log('[DEBUG] ConversationsController.getAll - req.user:', req.user);
      console.log('[DEBUG] ConversationsController.getAll - raw userId:', userId);
      console.log('[DEBUG] ConversationsController.getAll - raw centerId:', centerId);
      
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
      
      console.log('[DEBUG] ConversationsController.getAll - normalized userId:', normalizedUserId);
      console.log('[DEBUG] ConversationsController.getAll - normalized centerId:', centerId);
      
      const data = await conversationsModel.getAll(centerId, normalizedUserId); 
      console.log('[DEBUG] ConversationsController.getAll - returning', data.length, 'conversations');
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
      // ✅ Soft delete: Mark conversation as deleted for this user only
      // Other participants will still see the conversation
      const conversationId = req.params.id;
      const userId = req.user?.id || null;
      const centerId = req.center_id || req.user?.center_id || null;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Normalize userId
      const normalizedUserId = parseInt(userId);
      if (isNaN(normalizedUserId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Normalize conversationId
      const normalizedConversationId = parseInt(conversationId);
      if (isNaN(normalizedConversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const conversationParticipantsModel = require('../models/conversationParticipantsModel');
      const deleted = await conversationParticipantsModel.markConversationDeletedForUser(
        normalizedConversationId,
        normalizedUserId,
        centerId
      );
      
      if (!deleted) {
        return res.status(404).json({ error: "Conversation not found or you are not a participant" });
      }
      
      res.json({message: 'Conversation deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = conversationsController;
