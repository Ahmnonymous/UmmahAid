const conversationsModel = require('../models/conversationsModel');

const conversationsController = {
  getAll: async (req, res) => { try { const data = await conversationsModel.getAll(); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  getById: async (req, res) => { try { const data = await conversationsModel.getById(req.params.id); if(!data) return res.status(404).json({error: 'Not found'}); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  create: async (req, res) => { try { const data = await conversationsModel.create(req.body); res.status(201).json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  update: async (req, res) => { try { const data = await conversationsModel.update(req.params.id, req.body); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  delete: async (req, res) => { try { await conversationsModel.delete(req.params.id); res.json({message: 'Deleted successfully'}); } catch(err){ res.status(500).json({error: err.message}); } },

};

module.exports = conversationsController;
