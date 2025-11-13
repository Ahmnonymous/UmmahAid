const express = require('express');
const router = express.Router();
const applicantIncomeController = require('../controllers/applicantIncomeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware());
router.use(filterMiddleware);

router.get('/', applicantIncomeController.getAll);
router.get('/:id', applicantIncomeController.getById);
router.post('/', applicantIncomeController.create);
router.put('/:id', applicantIncomeController.update);
router.delete('/:id', applicantIncomeController.delete);

module.exports = router;
