const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware
router.use(authMiddleware);

// Dashboard statistics endpoint
router.get('/applicant-statistics', dashboardController.getApplicantStatistics);

module.exports = router;

