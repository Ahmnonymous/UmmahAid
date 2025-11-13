const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply authentication, RBAC, and tenant filtering for reports
router.use(authenticateToken);
router.use(roleMiddleware());

router.use(filterMiddleware);

// Applicant Details Report
router.get('/applicant-details', ReportsController.getApplicantDetails.bind(ReportsController));

// Total Financial Assistance Report (includes both financial and food assistance)
router.get('/total-financial-assistance', ReportsController.getTotalFinancialAssistance.bind(ReportsController));

// Financial Assistance Report
router.get('/financial-assistance', ReportsController.getFinancialAssistance.bind(ReportsController));

// Food Assistance Report
router.get('/food-assistance', ReportsController.getFoodAssistance.bind(ReportsController));

// Home Visits Report
router.get('/home-visits', ReportsController.getHomeVisits.bind(ReportsController));

// Center Audits Report
router.get('/center-audits', ReportsController.getCenterAudits.bind(ReportsController));

// Relationship Report
router.get('/relationship-report', ReportsController.getRelationshipReport.bind(ReportsController));

// Applicant Programs Report
router.get('/applicant-programs', ReportsController.getApplicantPrograms.bind(ReportsController));

// Financial Assessment Report
router.get('/financial-assessment', ReportsController.getFinancialAssessment.bind(ReportsController));

// Skills Matrix Report
router.get('/skills-matrix', ReportsController.getSkillsMatrix.bind(ReportsController));

module.exports = router;
