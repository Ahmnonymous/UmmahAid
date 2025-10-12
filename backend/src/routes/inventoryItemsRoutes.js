const express = require('express');
const router = express.Router();
const inventoryItemsController = require('../controllers/inventoryItemsController');

router.get('/', inventoryItemsController.getAll);
router.get('/:id', inventoryItemsController.getById);
router.post('/', inventoryItemsController.create);
router.put('/:id', inventoryItemsController.update);
router.delete('/:id', inventoryItemsController.delete);

module.exports = router;
