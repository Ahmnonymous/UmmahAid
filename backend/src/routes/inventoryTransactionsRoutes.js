const express = require('express');
const router = express.Router();
const inventoryTransactionsController = require('../controllers/inventoryTransactionsController');

router.get('/', inventoryTransactionsController.getAll);
router.get('/:id', inventoryTransactionsController.getById);
router.post('/', inventoryTransactionsController.create);
router.put('/:id', inventoryTransactionsController.update);
router.delete('/:id', inventoryTransactionsController.delete);

module.exports = router;
