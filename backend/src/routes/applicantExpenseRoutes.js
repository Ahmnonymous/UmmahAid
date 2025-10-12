const express = require('express');
const router = express.Router();
const applicantExpenseController = require('../controllers/applicantExpenseController');

router.get('/', applicantExpenseController.getAll);
router.get('/:id', applicantExpenseController.getById);
router.post('/', applicantExpenseController.create);
router.put('/:id', applicantExpenseController.update);
router.delete('/:id', applicantExpenseController.delete);

module.exports = router;
