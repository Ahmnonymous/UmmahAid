﻿const serviceRatingModel = require('../models/serviceRatingModel');

const serviceRatingController = {
  getAll: async (req, res) => { try { const data = await serviceRatingModel.getAll(); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  getById: async (req, res) => { try { const data = await serviceRatingModel.getById(req.params.id); if(!data) return res.status(404).json({error: 'Not found'}); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  create: async (req, res) => { try { const data = await serviceRatingModel.create(req.body); res.status(201).json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  update: async (req, res) => { try { const data = await serviceRatingModel.update(req.params.id, req.body); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  delete: async (req, res) => { try { await serviceRatingModel.delete(req.params.id); res.json({message: 'Deleted successfully'}); } catch(err){ res.status(500).json({error: err.message}); } },

};

module.exports = serviceRatingController;
