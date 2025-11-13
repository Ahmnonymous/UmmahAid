const lookupModel = require('../models/lookupModel');

const lookupTables = {
  Supplier_Category: { orderByName: true },
  Suburb: { orderByName: true },
  Nationality: { orderByName: true },
  Health_Conditions: { orderByName: true },
  Skills: { orderByName: true },
  Relationship_Types: { orderByName: true },
  Tasks_Status: { orderByName: true },
  Assistance_Types: { orderByName: true },
  File_Status: { orderByName: true },
  File_Condition: { orderByName: true },
  Dwelling_Status: { orderByName: true },
  Race: { orderByName: true },
  Dwelling_Type: { orderByName: true },
  Marital_Status: { orderByName: true },
  Education_Level: { orderByName: true },
  Employment_Status: { orderByName: true },
  Gender: { orderByName: true },
  Training_Outcome: { orderByName: true },
  Training_Level: { orderByName: true },
  Blood_Type: { orderByName: true },
  Rating: { orderByName: true },
  User_Types: { orderByName: true },
  Policy_Procedure_Type: { orderByName: true },
  Policy_Procedure_Field: { orderByName: true },
  Policy_and_Procedure: { orderByName: false },
  Income_Type: { orderByName: true },
  Expense_Type: { orderByName: true },
  Hampers: { orderByName: true },
  Born_Religion: { orderByName: true },
  Period_As_Muslim: { orderByName: true },
  Hadith: { orderByName: false },
  Training_Courses: { orderByName: true },
  Means_of_communication: { orderByName: true },
  Departments: { orderByName: true },
};

const getLookupConfig = (table = "") => lookupTables[table] || null;

const canMutateHadith = (req) => {
  const roleKey =
    (req.accessScope && req.accessScope.roleKey) ||
    req.user?.roleKey ||
    req.user?.role ||
    null;

  if (!roleKey) return false;

  return roleKey === "AppAdmin" || roleKey === "HQ";
};

const lookupController = {
  getAll: async (req, res) => {
    try {
      const { table } = req.params;
      
      const tableConfig = getLookupConfig(table);
      if (!tableConfig) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      const data = await lookupModel.getAll(table, !!tableConfig.orderByName);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { table, id } = req.params;
      const tableConfig = getLookupConfig(table);
      if (!tableConfig) {
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
      const tableConfig = getLookupConfig(table);
      if (!tableConfig) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      if (table === "Hadith" && !canMutateHadith(req)) {
        return res.status(403).json({
          error: "Forbidden: only App Admin and HQ can modify Hadith lookups",
        });
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
      const tableConfig = getLookupConfig(table);
      if (!tableConfig) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      if (table === "Hadith" && !canMutateHadith(req)) {
        return res.status(403).json({
          error: "Forbidden: only App Admin and HQ can modify Hadith lookups",
        });
      }
      const data = await lookupModel.update(table, id, req.body);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { table, id } = req.params;
      const tableConfig = getLookupConfig(table);
      if (!tableConfig) {
        return res.status(400).json({ error: 'Invalid lookup table' });
      }
      if (table === "Hadith" && !canMutateHadith(req)) {
        return res.status(403).json({
          error: "Forbidden: only App Admin and HQ can modify Hadith lookups",
        });
      }
      const deleted = await lookupModel.delete(table, id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = lookupController;
