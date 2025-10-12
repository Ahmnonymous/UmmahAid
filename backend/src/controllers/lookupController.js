const lookupModel = require('../models/lookupModel');

const lookupTables = {
  Supplier_Category: true,
  Suburb: true,
  Nationality: true,
  Health_Conditions: true,
  Skills: true,
  Relationship_Types: true,
  Tasks_Status: true,
  Assistance_Types: true,
  File_Status: true,
  File_Condition: true,
  Dwelling_Status: true,
  Race: true,
  Dwelling_Type: true,
  Marital_Status: true,
  Education_Level: true,
  Employment_Status: true,
  Gender: true,
  Training_Outcome: true,
  Training_Level: true,
  Blood_Type: true,
  Rating: true,
  User_Types: true,
  Policy_Procedure_Type: true,
  Policy_Procedure_Field: true,
  Income_Type: true,
  Expense_Type: true,
  Hampers: true,
  Born_Religion: true,
  Period_As_Muslim: true,
  Training_Courses: true,
  Means_of_communication: true,
  Departments: true
};

const lookupController = {
  getAll: async (req, res) => {
    try {
      const { table } = req.params;
      if (!lookupTables[table]) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      const data = await lookupModel.getAll(table, lookupTables[table]);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { table, id } = req.params;
      if (!lookupTables[table]) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      const data = await lookupModel.getById(table, id);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { table } = req.params;
      if (!lookupTables[table]) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      const data = await lookupModel.create(table, req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { table, id } = req.params;
      if (!lookupTables[table]) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      const data = await lookupModel.update(table, id, req.body);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { table, id } = req.params;
      if (!lookupTables[table]) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      await lookupModel.delete(table, id);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = lookupController;
