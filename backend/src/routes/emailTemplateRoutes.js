const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// View image endpoint - no auth required (for email display)
router.get('/:id/view-image', emailTemplateController.viewImage);

// Get by name - no auth required (for email sending)
router.get('/name/:templateName', emailTemplateController.getByName);

// All other routes require authentication
router.use(authMiddleware);

// Only App Admin (role 1) can manage email templates
router.use(roleMiddleware({ allowedRoles: [1] }));

router.get('/', emailTemplateController.getAll);
router.get('/:id', emailTemplateController.getById);

module.exports = router;

