const hseqToolboxMeetingTasksModel = require('../models/hseqToolboxMeetingTasksModel');
const hseqToolboxMeetingModel = require('../models/hseqToolboxMeetingModel');

const hseqToolboxMeetingTasksController = {
  getAll: async (req, res) => { 
    try {
      // ✅ Apply tenant filtering
      const meetingId = req.query.meeting_id;
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await hseqToolboxMeetingTasksModel.getAll(meetingId, centerId, isMultiCenter); 
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
      const data = await hseqToolboxMeetingTasksModel.getById(req.params.id, centerId, isMultiCenter); 
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
      
      // ✅ Determine center_id
      // Normal users (OrgAdmin, OrgCaseworker, etc.) use their own center_id
      let centerId = req.center_id || req.user?.center_id || null;

      // AppAdmin / HQ don't have a center_id, so inherit it from the parent meeting
      if (!centerId) {
        const meetingId =
          fields.hseq_toolbox_meeting_id || fields.HSEQ_Toolbox_Meeting_ID;

        if (meetingId) {
          try {
            // isMultiCenter = true so scopeQuery won't enforce a center filter
            const meeting = await hseqToolboxMeetingModel.getById(
              meetingId,
              null,
              true,
            );
            if (meeting && meeting.center_id) {
              centerId = meeting.center_id;
            }
          } catch (innerErr) {
            // If we can't resolve the meeting, fall back to null and let DB validation handle it
            console.error(
              "Error resolving center_id from HSEQ_Toolbox_Meeting:",
              innerErr,
            );
          }
        }
      }

      fields.center_id = centerId;
      
      const data = await hseqToolboxMeetingTasksModel.create(fields); 
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
      const data = await hseqToolboxMeetingTasksModel.update(req.params.id, fields, centerId, isMultiCenter); 
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
      const deleted = await hseqToolboxMeetingTasksModel.delete(req.params.id, centerId, isMultiCenter); 
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = hseqToolboxMeetingTasksController;
