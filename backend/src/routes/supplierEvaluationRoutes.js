const express = require('express');
const router = express.Router();
const supplierEvaluationController = require('../controllers/supplierEvaluationController');

router.get('/', supplierEvaluationController.getAll);
router.get('/:id', supplierEvaluationController.getById);
router.post('/', supplierEvaluationController.create);
router.put('/:id', supplierEvaluationController.update);
router.delete('/:id', supplierEvaluationController.delete);

module.exports = router;
