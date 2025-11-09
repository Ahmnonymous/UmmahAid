/**
 * Comprehensive Test Runner (UmmahAid)
 * Mirrors Hudasa's aggregated testing pipeline:
 *  - API smoke + RBAC checks
 *  - Role-focused QA flows
 *  - Attachment end-to-end validations per role
 * Generates consolidated JSON report for CI visibility.
 */

const fs = require('fs').promises;
const path = require('path');

const APITestRunner = require('./api-test-runner');
const AppAdminQATest = require('./app-admin-qa-test');
const HQQATest = require('./hq-qa-test');
const OrgAdminQATest = require('./org-admin-qa-test');
const OrgExecutiveQATest = require('./org-executive-qa-test');
const OrgCaseworkerQATest = require('./org-caseworker-qa-test');
const AttachmentQATest = require('./attachment-qa-test');

class ComprehensiveTestRunner {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.results = {
      environment,
      timestamp: new Date().toISOString(),
      testSuites: {},
      summary: {
        totalSuites: 0,
        completedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: [],
        warnings: []
      }
    };
  }

  async runTestSuite(suiteName, TestClass, ...args) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Running ${suiteName}...`);
    console.log('='.repeat(80));

    try {
      const tester = new TestClass(...args);
      let results;

      if (typeof tester.runAllTests === 'function') {
        results = await tester.runAllTests();
      } else if (typeof tester.run === 'function') {
        await tester.run();
        results = tester.results || { summary: { totalTests: 0, passed: 0, failed: 0, errors: [], warnings: [] } };
      } else {
        throw new Error(`Test class ${suiteName} does not expose runAllTests() or run()`);
      }

      if (typeof tester.generateReport === 'function') {
        await tester.generateReport();
      } else if (typeof tester.saveResults === 'function') {
        await tester.saveResults();
      }

      const summary = results?.summary || tester.results?.summary || {};
      const totalTests = summary.total || summary.totalTests || 0;
      const passedTests = summary.passed || summary.passedTests || 0;
      const failedTests = summary.failed || summary.failedTests || 0;
      const status =
        summary.overallStatus === 'FAIL' || failedTests > 0 ? 'FAILED' :
        summary.overallStatus === 'SKIP' ? 'SKIPPED' :
        summary.overallStatus === 'ERROR' ? 'FAILED' :
        'PASSED';

      const errors = summary.errors || [];
      const warnings = summary.warnings || [];

      this.results.testSuites[suiteName] = {
        status,
        totalTests,
        passedTests,
        failedTests,
        errors,
        warnings,
        details: results || tester.results || {}
      };

      this.results.summary.totalSuites += 1;
      if (status !== 'ERROR') {
        this.results.summary.completedSuites += 1;
      }
      this.results.summary.totalTests += totalTests;
      this.results.summary.passedTests += passedTests;
      this.results.summary.failedTests += failedTests;

      if (errors.length) {
        this.results.summary.errors.push(...errors.map(err => ({ suite: suiteName, error: err })));
      }
      if (warnings.length) {
        this.results.summary.warnings.push(...warnings.map(warn => ({ suite: suiteName, warning: warn })));
      }

      console.log(`✅ ${suiteName} completed: ${passedTests}/${totalTests} passed`);
      return results;
    } catch (error) {
      console.error(`❌ ${suiteName} failed: ${error.message}`);
      this.results.testSuites[suiteName] = {
        status: 'ERROR',
        error: error.message,
        stack: error.stack
      };
      this.results.summary.totalSuites += 1;
      this.results.summary.errors.push({ suite: suiteName, error: error.message });
      return null;
    }
  }

  async runAllTests() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🚀 COMPREHENSIVE TEST RUNNER (UmmahAid)');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.environment}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('='.repeat(80));

    await this.runTestSuite('API Test Runner', APITestRunner, this.environment);
    await this.runTestSuite('App Admin QA', AppAdminQATest, this.environment);
    await this.runTestSuite('HQ QA', HQQATest, this.environment);
    await this.runTestSuite('Org Admin QA', OrgAdminQATest, this.environment);
    await this.runTestSuite('Org Executive QA', OrgExecutiveQATest, this.environment);
    await this.runTestSuite('Org Caseworker QA', OrgCaseworkerQATest, this.environment);

    console.log(`\n${'='.repeat(80)}`);
    console.log('📎 Running Attachment QA across roles...');
    console.log('='.repeat(80));

    const attachmentRoles = [1, 2, 3, 4, 5];
    for (const roleId of attachmentRoles) {
      await this.runTestSuite(`Attachment QA - Role ${roleId}`, AttachmentQATest, roleId, this.environment);
    }

    await this.generateComprehensiveReport();
    return this.results;
  }

  async generateComprehensiveReport() {
    const reportDir = path.join(__dirname, 'test-results');
    await fs.mkdir(reportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonReportFile = path.join(reportDir, `comprehensive-test-report-${timestamp}.json`);
    await fs.writeFile(jsonReportFile, JSON.stringify(this.results, null, 2));

    console.log(`\n${'='.repeat(80)}`);
    console.log('📄 TEST REPORT SAVED');
    console.log('='.repeat(80));
    console.log(`JSON Report: ${jsonReportFile}`);
    console.log('='.repeat(80));

    return { jsonReportFile };
  }
}

if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const runner = new ComprehensiveTestRunner(environment);

  runner.runAllTests()
    .then(results => {
      const exitCode = results.summary.failedTests > 0 ? 1 : 0;
      console.log(`\n${'='.repeat(80)}`);
      console.log('📊 FINAL SUMMARY');
      console.log('='.repeat(80));
      console.log(`Total Tests: ${results.summary.totalTests}`);
      console.log(`Passed: ${results.summary.passedTests} ✅`);
      console.log(`Failed: ${results.summary.failedTests} ❌`);
      const rate = results.summary.totalTests
        ? ((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(2)
        : '0.00';
      console.log(`Success Rate: ${rate}%`);
      console.log('='.repeat(80));
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;


