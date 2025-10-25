const hseqToolboxMeetingTasksModel = require('../models/hseqToolboxMeetingTasksModel');

const hseqToolboxMeetingTasksController = {
  getAll: async (req, res) => { 
    try { 
      const meetingId = req.query.meeting_id;
      const data = await hseqToolboxMeetingTasksModel.getAll(meetingId); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  getById: async (req, res) => { try { const data = await hseqToolboxMeetingTasksModel.getById(req.params.id); if(!data) return res.status(404).json({error: 'Not found'}); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  create: async (req, res) => { try { const data = await hseqToolboxMeetingTasksModel.create(req.body); res.status(201).json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  update: async (req, res) => { try { const data = await hseqToolboxMeetingTasksModel.update(req.params.id, req.body); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  delete: async (req, res) => { try { await hseqToolboxMeetingTasksModel.delete(req.params.id); res.json({message: 'Deleted successfully'}); } catch(err){ res.status(500).json({error: err.message}); } },

};

module.exports = hseqToolboxMeetingTasksController;
