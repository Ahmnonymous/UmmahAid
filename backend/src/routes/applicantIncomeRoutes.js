const express = require('express');
const router = express.Router();
const applicantIncomeController = require('../controllers/applicantIncomeController');

router.get('/', applicantIncomeController.getAll);
router.get('/:id', applicantIncomeController.getById);
router.post('/', applicantIncomeController.create);
router.put('/:id', applicantIncomeController.update);
router.delete('/:id', applicantIncomeController.delete);

module.exports = router;
