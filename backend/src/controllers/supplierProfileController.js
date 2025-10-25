const supplierProfileModel = require('../models/supplierProfileModel');

const supplierProfileController = {
  getAll: async (req, res) => { 
    try { 
      const data = await supplierProfileModel.getAll(req.user?.center_id); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  getById: async (req, res) => { 
    try { 
      const data = await supplierProfileModel.getById(req.params.id, req.user?.center_id); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  create: async (req, res) => { 
    try { 
      const data = await supplierProfileModel.create(req.body, req.user?.center_id); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  update: async (req, res) => { 
    try { 
      const data = await supplierProfileModel.update(req.params.id, req.body, req.user?.center_id); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  delete: async (req, res) => { 
    try { 
      await supplierProfileModel.delete(req.params.id, req.user?.center_id); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = supplierProfileController;
