const express = require('express');
const router = express.Router();
const foodAssistanceController = require('../controllers/foodAssistanceController');

router.get('/', foodAssistanceController.getAll);
router.get('/:id', foodAssistanceController.getById);
router.post('/', foodAssistanceController.create);
router.put('/:id', foodAssistanceController.update);
router.delete('/:id', foodAssistanceController.delete);

module.exports = router;
