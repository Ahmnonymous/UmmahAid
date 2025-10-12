const express = require('express');
const router = express.Router();
const conversationsController = require('../controllers/conversationsController');

router.get('/', conversationsController.getAll);
router.get('/:id', conversationsController.getById);
router.post('/', conversationsController.create);
router.put('/:id', conversationsController.update);
router.delete('/:id', conversationsController.delete);

module.exports = router;
