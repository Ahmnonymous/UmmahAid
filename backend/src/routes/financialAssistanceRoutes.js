const express = require('express');
const router = express.Router();
const financialAssistanceController = require('../controllers/financialAssistanceController');

router.get('/', financialAssistanceController.getAll);
router.get('/:id', financialAssistanceController.getById);
router.post('/', financialAssistanceController.create);
router.put('/:id', financialAssistanceController.update);
router.delete('/:id', financialAssistanceController.delete);

module.exports = router;
