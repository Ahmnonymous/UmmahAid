const express = require('express');
const router = express.Router();
const trainingInstitutionsController = require('../controllers/trainingInstitutionsController');

router.get('/', trainingInstitutionsController.getAll);
router.get('/:id', trainingInstitutionsController.getById);
router.post('/', trainingInstitutionsController.create);
router.put('/:id', trainingInstitutionsController.update);
router.delete('/:id', trainingInstitutionsController.delete);

module.exports = router;
