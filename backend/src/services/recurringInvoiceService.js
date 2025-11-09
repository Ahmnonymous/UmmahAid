const cron = require('node-cron');
const financialAssistanceModel = require('../models/financialAssistanceModel');
const recurringInvoiceLogModel = require('../models/recurringInvoiceLogModel');

const SUPPORTED_FREQUENCIES = ['daily', 'weekly', 'monthly'];

let cronTask = null;

const formatDate = (date) => {
  if (!date) return null;
  const instance = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instance.getTime())) return null;
  return instance.toISOString().split('T')[0];
};

const parseDate = (date) => {
  if (!date) return null;
  const instance = date instanceof Date ? date : new Date(date);
  return Number.isNaN(instance.getTime()) ? null : instance;
};

const addFrequency = (date, frequency) => {
  const base = parseDate(date);
  if (!base) return null;

  const normalizedFrequency = (frequency || '').toLowerCase();
  const next = new Date(base.getTime());

  switch (normalizedFrequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly': {
      const day = next.getDate();
      next.setMonth(next.getMonth() + 1);

      // Handle months with fewer days by rolling back
      if (next.getDate() < day) {
        next.setDate(0);
      }
      break;
    }
    default:
      return null;
  }

  return next;
};

const isFrequencySupported = (frequency) =>
  SUPPORTED_FREQUENCIES.includes((frequency || '').toLowerCase());

const withinRange = (date, start, end) => {
  const value = parseDate(date);
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!value || !startDate || !endDate) return false;
  return value >= startDate && value <= endDate;
};

const cloneTemplatePayload = (template, dateOfAssistance) => {
  const sanitizedDate = formatDate(dateOfAssistance);

  return {
    file_id: template.file_id,
    assistance_type: template.assistance_type,
    financial_amount: template.financial_amount,
    date_of_assistance: sanitizedDate,
    assisted_by: template.assisted_by,
    sector: template.sector,
    program: template.program,
    project: template.project,
    give_to: template.give_to,
    starting_date: template.starting_date,
    end_date: template.end_date,
    frequency: template.frequency,
    is_recurring: false,
    is_auto_generated: true,
    recurring_source_id: template.id,
    center_id: template.center_id,
    created_by: 'system',
    updated_by: 'system'
  };
};

const processTemplate = async (template, referenceDate = new Date()) => {
  const createdEntries = [];

  if (!template || !isFrequencySupported(template.frequency)) {
    return createdEntries;
  }

  const startDate = parseDate(template.starting_date);
  const endDate = parseDate(template.end_date);
  const refDate = parseDate(referenceDate);

  if (!startDate || !endDate || !refDate) {
    return createdEntries;
  }

  // Determine last generated date (including template row)
  const lastGeneratedDateRaw = await financialAssistanceModel.getLastGeneratedAssistanceDate(template.id);
  const lastGeneratedDate = lastGeneratedDateRaw ? parseDate(lastGeneratedDateRaw) : null;

  let nextDate = lastGeneratedDate ? addFrequency(lastGeneratedDate, template.frequency) : startDate;

  while (
    nextDate &&
    withinRange(nextDate, startDate, endDate) &&
    parseDate(formatDate(nextDate)) <= refDate
  ) {
    const targetDateStr = formatDate(nextDate);

    const existing = await financialAssistanceModel.findOccurrenceByTemplateAndDate(
      template.id,
      targetDateStr
    );

    if (!existing) {
      const payload = cloneTemplatePayload(template, nextDate);
      const created = await financialAssistanceModel.create(payload);
      createdEntries.push(created);

      const upcomingDate = addFrequency(nextDate, template.frequency);
      await recurringInvoiceLogModel.create({
        applicant_id: template.file_id,
        financial_aid_id: created.id,
        source_financial_aid_id: template.id,
        next_run_date: upcomingDate ? formatDate(upcomingDate) : null,
        frequency: (template.frequency || '').toLowerCase(),
        created_by_system: true,
        created_by: 'system',
        updated_by: 'system',
        center_id: template.center_id
      });
    }

    nextDate = addFrequency(nextDate, template.frequency);
  }

  return createdEntries;
};

const processRecurringInvoices = async (referenceDate = new Date()) => {
  const templates = await financialAssistanceModel.getRecurringTemplates(referenceDate);
  const results = [];

  for (const template of templates) {
    const created = await processTemplate(template, referenceDate);
    results.push(...created);
  }

  return results;
};

const startScheduler = () => {
  if (cronTask || process.env.NODE_ENV === 'test' || process.env.DISABLE_RECURRING_CRON === 'true') {
    return;
  }

  cronTask = cron.schedule(
    process.env.RECURRING_INVOICE_CRON || '0 2 * * *',
    async () => {
      try {
        await processRecurringInvoices(new Date());
      } catch (error) {
        console.error('[RecurringInvoiceScheduler] Failed to process recurring invoices:', error);
      }
    },
    {
      timezone: process.env.RECURRING_INVOICE_TIMEZONE || 'Africa/Johannesburg'
    }
  );
};

const stopScheduler = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  processRecurringInvoices,
  processTemplate,
  SUPPORTED_FREQUENCIES,
  isFrequencySupported,
  formatDate,
  addFrequency
};

