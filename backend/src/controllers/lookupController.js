const lookupModel = require('../models/lookupModel');
const { cacheLookup, invalidateLookup } = require('../services/cacheService');

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

      // ✅ Use cache for lookup tables (24 hour TTL - rarely change)
      // Lookup tables are global (not center-specific), so centerId = null
      const data = await cacheLookup(
        table,
        null, // centerId = null (global lookup)
        () => lookupModel.getAll(table, !!tableConfig.orderByName),
        86400 // 24 hours TTL
      );

      console.log(`[lookupController.getAll] Table: ${table}, Returning ${data.length} rows`);
      res.json(data);
    } catch (err) {
      console.error(`[lookupController.getAll] Error for table ${req.params.table}:`, err.message);
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
      
      // ✅ Invalidate cache after creating new lookup entry
      console.log(`[lookupController.create] Invalidating cache for table: ${table}`);
      const invalidated = await invalidateLookup(table, null); // null = invalidate for all centers (global lookup)
      console.log(`[lookupController.create] Cache invalidation result: ${invalidated}`);
      
      console.log(`[lookupController.create] Created record for table ${table}:`, data);
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
      console.log(`[lookupController.update] Table: ${table}, ID: ${id}, Body:`, req.body);
      
      // ✅ Invalidate cache BEFORE update to ensure fresh data on next fetch
      console.log(`[lookupController.update] Invalidating cache for table: ${table} (before update)`);
      await invalidateLookup(table, null); // null = invalidate for all centers (global lookup)
      
      const data = await lookupModel.update(table, id, req.body);
      if (!data) {
        console.warn(`[lookupController.update] Record not found for table ${table}, ID: ${id}`);
        return res.status(404).json({ error: 'Not found' });
      }
      
      // ✅ Invalidate cache again AFTER update to be safe
      console.log(`[lookupController.update] Invalidating cache for table: ${table} (after update)`);
      await invalidateLookup(table, null);
      
      console.log(`[lookupController.update] Successfully updated record for table ${table}, ID: ${id}`);
      console.log(`[lookupController.update] Returning data:`, data);
      res.json(data);
    } catch (err) {
      console.error(`[lookupController.update] Error for table ${req.params.table}, ID ${req.params.id}:`, err.message);
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
      
      // ✅ Invalidate cache after deleting lookup entry
      await invalidateLookup(table, null); // null = invalidate for all centers (global lookup)
      
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = lookupController;
