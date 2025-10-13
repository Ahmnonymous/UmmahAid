const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Applicant Details Report
router.get('/applicant-details', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getApplicantDetails.bind(ReportsController)
);

// Total Financial Assistance Report (includes both financial and food assistance)
router.get('/total-financial-assistance', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getTotalFinancialAssistance.bind(ReportsController)
);

// Financial Assistance Report
router.get('/financial-assistance', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getFinancialAssistance.bind(ReportsController)
);

// Food Assistance Report
router.get('/food-assistance', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getFoodAssistance.bind(ReportsController)
);

// Home Visits Report
router.get('/home-visits', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getHomeVisits.bind(ReportsController)
);

// Relationship Report
router.get('/relationship-report', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getRelationshipReport.bind(ReportsController)
);

// Applicant Programs Report
router.get('/applicant-programs', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getApplicantPrograms.bind(ReportsController)
);

// Financial Assessment Report
router.get('/financial-assessment', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getFinancialAssessment.bind(ReportsController)
);

// Skills Matrix Report
router.get('/skills-matrix', 
    roleMiddleware([1, 2, 3]), // Org. Caseworkers, Org. Admin, Org. Executives
    ReportsController.getSkillsMatrix.bind(ReportsController)
);

module.exports = router;
