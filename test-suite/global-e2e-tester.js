/**
 * Global End-to-End Tester (UmmahAid)
 * -----------------------------------
 * Reusable test harness that mirrors the recurring invoice methodology:
 *  1. Create data via API
 *  2. Invoke schedulers/background services programmatically
 *  3. Verify persistence layer (flags, audits, FK integrity)
 *  4. Confirm UI-visible state via API/DOM-facing endpoints
 *  5. Clean up artefacts to keep the environment repeatable
 *
 * The harness is intentionally modular—each feature registers a module
 * definition with setup/run/teardown hooks so additional coverage can
 * be plugged in without reworking the core runner.
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const axios = require('axios');
const { Pool } = require('pg');
const dotenv = require('dotenv');

const testConfig = require('./test-config');

// Ensure backend environment variables are available when we import services.
const backendEnvPath = path.resolve(__dirname, '../backend/.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
const DEFAULT_DATABASE_URL = 'postgresql://postgres:123456@localhost:5432/welfare_app';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}
process.env.DISABLE_RECURRING_CRON = 'true';

// Import backend scheduler services after env bootstrap.
const recurringInvoiceService = require('../backend/src/services/recurringInvoiceService');

/**
 * Utility helpers
 */
const formatDate = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const tzOffset = copy.getTimezoneOffset() * 60000;
  return new Date(copy.getTime() - tzOffset).toISOString().split('T')[0];
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const ensureDir = async (targetDir) => {
  await fsp.mkdir(targetDir, { recursive: true });
};

class GlobalE2ETester {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.envConfig = testConfig.environments[environment];
    if (!this.envConfig) {
      throw new Error(`Unknown environment "${environment}"`);
    }

    this.results = {
      environment,
      baseURL: this.envConfig.baseURL,
      startedAt: new Date().toISOString(),
      modules: {},
      summary: {
        totalModules: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: []
      }
    };

    this.http = axios.create({
      baseURL: this.envConfig.baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.activeToken = null;
    this.cleanupTasks = [];

    this.modules = [
      this.buildRecurringInvoiceModule(),
      // ⬇️ Placeholder registrations for future modules
      {
        key: 'placeholder-modules',
        name: 'Other Feature Modules',
        status: 'SKIPPED',
        reason: 'Module coverage not yet implemented. Extend modules[] with additional definitions.',
        handler: async () => ({
          status: 'SKIPPED',
          steps: [],
          metadata: { note: 'Pending implementation' }
        })
      }
    ];
  }

  async loginAsAppAdmin() {
    const appAdmin =
      testConfig.testUsers.find((user) => user.role === 1) ||
      testConfig.testUsers[0];

    if (!appAdmin) {
      throw new Error('No App Admin user defined in test-config.js');
    }

    const response = await this.http.post(
      testConfig.apiEndpoints.auth.login,
      {
        username: appAdmin.username,
        password: appAdmin.password
      }
    );

    if (!response.data?.token) {
      throw new Error('Authentication failed: token not present in response');
    }

    this.activeToken = response.data.token;
    this.http.defaults.headers.common['Authorization'] = `Bearer ${this.activeToken}`;
    return { user: appAdmin, token: this.activeToken, userInfo: response.data.userInfo || response.data.user };
  }

  registerCleanup(fn) {
    if (typeof fn === 'function') {
      this.cleanupTasks.push(fn);
    }
  }

  async runCleanup() {
    while (this.cleanupTasks.length) {
      const task = this.cleanupTasks.pop();
      try {
        await task();
      } catch (err) {
        console.warn('⚠️  Cleanup task failed:', err.message);
      }
    }
  }

  buildRecurringInvoiceModule() {
    return {
      key: 'recurring-invoice',
      name: 'Recurring Invoice',
      handler: async (ctx) => {
        const steps = [];
        const detail = {
          marker: `E2E-Recurring-${Date.now()}`,
          templateId: null,
          generatedEntryIds: [],
          logIds: []
        };

        const recordStep = (message, payload = {}) => {
          steps.push({
            message,
            timestamp: new Date().toISOString(),
            ...('status' in payload ? { status: payload.status } : {}),
            ...(payload.details ? { details: payload.details } : {})
          });
        };

        const startDate = addDays(new Date(), 1);
        const endDate = addDays(startDate, 3);
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        const cleanupTemplateData = async () => {
          if (!detail.marker) return;
          await ctx.db.query(
            'DELETE FROM recurring_invoice_log WHERE source_financial_aid_id IN (SELECT id FROM financial_assistance WHERE give_to = $1)',
            [detail.marker]
          );
          await ctx.db.query('DELETE FROM financial_assistance WHERE give_to = $1', [detail.marker]);
        };

        // Ensure a clean slate before running the module
        await cleanupTemplateData();
        ctx.registerCleanup(cleanupTemplateData);

        const payload = {
          file_id: 9,
          assistance_type: 1,
          financial_amount: 250.0,
          date_of_assistance: startDateStr,
          assisted_by: null,
          sector: detail.marker,
          program: detail.marker,
          project: detail.marker,
          give_to: detail.marker,
          starting_date: startDateStr,
          end_date: endDateStr,
          frequency: 'daily'
        };

        try {
          recordStep('Creating recurring template via API');
          const creationResponse = await ctx.http.post(
            '/financialAssistance/recurring',
            payload
          );

          if (creationResponse.status !== 201) {
            throw new Error(`Unexpected response status ${creationResponse.status}`);
          }

          const template = creationResponse.data?.template;
          if (!template?.id) {
            throw new Error('Template ID missing from creation response');
          }

          detail.templateId = template.id;
          recordStep('Template created', { details: { templateId: template.id } });

          const schedulerCleanup = async () => {
            await ctx.db.query('DELETE FROM recurring_invoice_log WHERE source_financial_aid_id = $1', [detail.templateId]);
            await ctx.db.query('DELETE FROM financial_assistance WHERE id = $1 OR recurring_source_id = $1', [detail.templateId]);
          };
          ctx.registerCleanup(schedulerCleanup);

          recordStep('Triggering scheduler programmatically');
          const schedulerResults = await ctx.services.recurringInvoice.processRecurringInvoices(new Date(startDateStr));
          if (!Array.isArray(schedulerResults)) {
            throw new Error('Scheduler did not return an array of created entries');
          }

          detail.generatedEntryIds = schedulerResults.map((entry) => entry.id).filter(Boolean);
          recordStep('Scheduler run complete', { details: { generatedEntries: detail.generatedEntryIds } });

          recordStep('Verifying financial assistance records in database');
          const assistanceRows = await ctx.db.query(
            `SELECT id, give_to, is_recurring, is_auto_generated, recurring_source_id,
                    created_by, updated_by, created_at, updated_at, center_id
               FROM financial_assistance
              WHERE give_to = $1
              ORDER BY id`,
            [detail.marker]
          );

          if (assistanceRows.rowCount < 1) {
            throw new Error('Template row not persisted in financial_assistance');
          }

          const templateRow = assistanceRows.rows.find((row) => row.id === detail.templateId);
          if (!templateRow) {
            throw new Error('Template row not found in financial_assistance query result');
          }
          if (!templateRow.is_recurring || templateRow.is_auto_generated) {
            throw new Error('Template flags (is_recurring/is_auto_generated) are incorrect');
          }
          if (!templateRow.created_by || !templateRow.updated_by) {
            throw new Error('Template audit fields are missing');
          }

          const generatedRow = assistanceRows.rows.find((row) => row.recurring_source_id === detail.templateId);
          if (!generatedRow) {
            throw new Error('Auto-generated invoice row not found');
          }
          if (generatedRow.is_recurring || !generatedRow.is_auto_generated) {
            throw new Error('Generated invoice flags are incorrect');
          }
          if (generatedRow.created_by !== 'system' || generatedRow.updated_by !== 'system') {
            throw new Error('Generated invoice audit fields incorrect');
          }
          if (generatedRow.center_id !== templateRow.center_id) {
            throw new Error('Center ID mismatch between template and generated rows');
          }

          recordStep('Database verification succeeded', {
            details: {
              rows: assistanceRows.rows.map((row) => ({
                id: row.id,
                is_recurring: row.is_recurring,
                is_auto_generated: row.is_auto_generated,
                recurring_source_id: row.recurring_source_id
              }))
            }
          });

          recordStep('Verifying recurring invoice log entries');
          const logRows = await ctx.db.query(
            `SELECT id, source_financial_aid_id, financial_aid_id, created_by_system, center_id, next_run_date
               FROM recurring_invoice_log
              WHERE source_financial_aid_id = $1
              ORDER BY id`,
            [detail.templateId]
          );

          if (logRows.rowCount < 1) {
            throw new Error('Recurring invoice log entries were not created');
          }

          const logRow = logRows.rows[0];
          if (!logRow.created_by_system) {
            throw new Error('Recurring invoice log should be flagged as system-created');
          }

          if (String(logRow.financial_aid_id) !== String(generatedRow.id)) {
            throw new Error('Recurring invoice log does not reference generated assistance entry');
          }

          const nextRunFormatted = logRow.next_run_date
            ? formatDate(new Date(logRow.next_run_date))
            : null;

          recordStep('Recurring invoice log verification succeeded', {
            details: {
              logEntry: {
                id: logRow.id,
                financial_aid_id: logRow.financial_aid_id,
                next_run_date: nextRunFormatted
              }
            }
          });

          detail.logIds = logRows.rows.map((row) => row.id);

          recordStep('Verifying API/state exposure via financial assistance listing');
          const apiListResponse = await ctx.http.get('/financialAssistance');
          const apiRowMatch = apiListResponse.data.find((row) => row.give_to === detail.marker);
          if (!apiRowMatch) {
            throw new Error('Financial assistance API list did not reflect the template entry');
          }

          recordStep('API verification succeeded', {
            details: { matchedRowId: apiRowMatch.id }
          });

          return {
            status: 'PASSED',
            steps,
            metadata: detail
          };
        } catch (error) {
          recordStep('Module failed', { status: 'FAILED', details: { error: error.message } });
          throw error;
        }
      }
    };
  }

  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('🌐 GLOBAL END-TO-END TESTER (UmmahAid)');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.environment}`);
    console.log(`Base URL:   ${this.envConfig.baseURL}`);
    console.log('='.repeat(80));

    try {
      console.log('\n🔐 Authenticating as App Admin...');
      const authContext = await this.loginAsAppAdmin();
      console.log(`   Authenticated as ${authContext.user.username}`);
    } catch (error) {
      await this.db.end();
      throw new Error(`Authentication failed: ${error.message}`);
    }

    for (const moduleDef of this.modules) {
      this.results.summary.totalModules += 1;
      const moduleKey = moduleDef.key;
      const moduleName = moduleDef.name;
      console.log('\n' + '-'.repeat(80));
      console.log(`🧪 Module: ${moduleName}`);
      console.log('-'.repeat(80));

      if (moduleDef.status === 'SKIPPED') {
        console.log(`   ⚠️  Skipped: ${moduleDef.reason}`);
        this.results.modules[moduleKey] = {
          status: 'SKIPPED',
          reason: moduleDef.reason
        };
        this.results.summary.skipped += 1;
        continue;
      }

      const ctx = {
        http: this.http,
        db: this.db,
        services: {
          recurringInvoice: recurringInvoiceService
        },
        registerCleanup: (fn) => this.registerCleanup(fn)
      };

      try {
        const outcome = await moduleDef.handler(ctx);
        this.results.modules[moduleKey] = {
          status: outcome.status,
          steps: outcome.steps,
          metadata: outcome.metadata
        };
        if (outcome.status === 'PASSED') {
          console.log(`   ✅ ${moduleName} passed`);
          this.results.summary.passed += 1;
        } else {
          console.log(`   ⚠️  ${moduleName} completed with status: ${outcome.status}`);
        }
      } catch (error) {
        console.error(`   ❌ ${moduleName} failed: ${error.message}`);
        this.results.modules[moduleKey] = {
          status: 'FAILED',
          error: error.message
        };
        this.results.summary.failed += 1;
        this.results.summary.errors.push({ module: moduleName, error: error.message });
      } finally {
        await this.runCleanup();
      }
    }

    await this.db.end();
    this.results.completedAt = new Date().toISOString();
    await this.saveReport();
    this.printSummary();
    return this.results;
  }

  async saveReport() {
    const outputDir = path.join(__dirname, 'test-results', 'global');
    await ensureDir(outputDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(outputDir, `global-e2e-report-${timestamp}.json`);
    await fsp.writeFile(reportPath, JSON.stringify(this.results, null, 2), 'utf8');
    console.log('\n' + '='.repeat(80));
    console.log('📄 GLOBAL TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Saved JSON: ${reportPath}`);
    console.log('='.repeat(80));
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MODULE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total modules: ${this.results.summary.totalModules}`);
    console.log(`Passed:        ${this.results.summary.passed}`);
    console.log(`Failed:        ${this.results.summary.failed}`);
    console.log(`Skipped:       ${this.results.summary.skipped}`);
    if (this.results.summary.errors.length) {
      console.log('\nErrors:');
      this.results.summary.errors.forEach((err, index) => {
        console.log(` ${index + 1}. [${err.module}] ${err.error}`);
      });
    }
    console.log('='.repeat(80));
  }
}

if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const tester = new GlobalE2ETester(environment);
  tester
    .run()
    .then((results) => {
      const exitCode = results.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('\n❌ Global E2E Tester failed:', error);
      process.exit(1);
    });
}

module.exports = GlobalE2ETester;


