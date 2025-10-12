const express = require('express');
const router = express.Router();
const financialAssessmentController = require('../controllers/financialAssessmentController');

router.get('/', financialAssessmentController.getAll);
router.get('/:id', financialAssessmentController.getById);
router.post('/', financialAssessmentController.create);
router.put('/:id', financialAssessmentController.update);
router.delete('/:id', financialAssessmentController.delete);

module.exports = router;
