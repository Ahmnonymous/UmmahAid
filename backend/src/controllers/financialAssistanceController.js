const financialAssistanceModel = require('../models/financialAssistanceModel');
const recurringInvoiceService = require('../services/recurringInvoiceService');
const { ROLES } = require('../constants/rbacMatrix');

const financialAssistanceController = {
  getAll: async (req, res) => {
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await financialAssistanceModel.getAll(centerId, isMultiCenter);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await financialAssistanceModel.getById(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      // ✅ Add audit fields
      const username = req.user?.username || 'system';
      req.body.created_by = username;
      req.body.updated_by = username;
      req.body.is_auto_generated = false;
      delete req.body.recurring_source_id;
      
      // ✅ Add center_id
      req.body.center_id = req.center_id || req.user?.center_id;
      
      const data = await financialAssistanceModel.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  createRecurring: async (req, res) => {
    try {
      const username = req.user?.username || 'system';
      const centerId = req.center_id || req.user?.center_id;
      const userRole = req.user?.user_type ? parseInt(req.user.user_type, 10) : null;

      if (![ROLES.APP_ADMIN, ROLES.HQ, ROLES.ORG_ADMIN].includes(userRole)) {
        return res.status(403).json({ error: 'You do not have permission to create recurring invoices.' });
      }

      const {
        file_id,
        assistance_type,
        financial_amount,
        date_of_assistance,
        assisted_by,
        sector,
        program,
        project,
        give_to,
        starting_date,
        end_date,
        frequency
      } = req.body;

      if (!file_id) {
        return res.status(400).json({ error: 'Applicant (file_id) is required.' });
      }

      if (!starting_date || !end_date) {
        return res.status(400).json({ error: 'Starting date and end date are required.' });
      }

      if (!frequency || !recurringInvoiceService.isFrequencySupported(frequency)) {
        return res.status(400).json({ error: 'Frequency must be Daily, Weekly, or Monthly.' });
      }

      const startDate = new Date(starting_date);
      const endDate = new Date(end_date);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Starting date and end date must be valid dates.' });
      }

      if (endDate < startDate) {
        return res.status(400).json({ error: 'End date must be after start date.' });
      }

      const MAX_RANGE_DAYS = 366;
      const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (dayDiff > MAX_RANGE_DAYS) {
        return res.status(400).json({ error: 'Recurring schedules cannot exceed 12 months.' });
      }

      const payload = {
        file_id,
        assistance_type,
        financial_amount,
        date_of_assistance: date_of_assistance || starting_date,
        assisted_by,
        sector,
        program,
        project,
        give_to,
        starting_date,
        end_date,
        frequency: frequency.toLowerCase(),
        is_recurring: true,
        is_auto_generated: false,
        created_by: username,
        updated_by: username,
        center_id: centerId
      };

      const templateRecord = await financialAssistanceModel.create(payload);
      const generatedEntries = await recurringInvoiceService.processTemplate(templateRecord, new Date());

      res.status(201).json({
        template: templateRecord,
        generated: generatedEntries
      });
    } catch (err) {
      console.error('Error creating recurring financial assistance:', err);
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      // ✅ Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      req.body.updated_by = username;
      delete req.body.created_by; // Prevent overwrite
      delete req.body.is_auto_generated;
      delete req.body.recurring_source_id;
      
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await financialAssistanceModel.update(req.params.id, req.body, centerId, isMultiCenter);
      if (!data) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const deleted = await financialAssistanceModel.delete(req.params.id, centerId, isMultiCenter);
      if (!deleted) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = financialAssistanceController;
