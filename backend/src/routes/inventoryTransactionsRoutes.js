const express = require('express');
const router = express.Router();
const inventoryTransactionsController = require('../controllers/inventoryTransactionsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply authentication, RBAC, and tenant filtering (inventory restricted to App Admin)
router.use(authMiddleware);
router.use(roleMiddleware());
router.use(filterMiddleware);

router.get('/', inventoryTransactionsController.getAll);
router.get('/:id', inventoryTransactionsController.getById);
router.post('/', inventoryTransactionsController.create);
router.put('/:id', inventoryTransactionsController.update);
router.delete('/:id', inventoryTransactionsController.delete);

module.exports = router;
