const employeeAppraisalModel = require('../models/employeeAppraisalModel');

const employeeAppraisalController = {
  getAll: async (req, res) => { 
    try { 
      const data = await employeeAppraisalModel.getAll(); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await employeeAppraisalModel.getById(req.params.id); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const data = await employeeAppraisalModel.create(req.body); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Employee_Appraisal: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const data = await employeeAppraisalModel.update(req.params.id, req.body); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Employee_Appraisal: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await employeeAppraisalModel.delete(req.params.id); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  }
};

module.exports = employeeAppraisalController;
