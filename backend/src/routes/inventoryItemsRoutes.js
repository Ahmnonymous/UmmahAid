const express = require('express');
const router = express.Router();
const inventoryItemsController = require('../controllers/inventoryItemsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply authentication to all routes
router.use(authMiddleware);

// ✅ RBAC enforced centrally (Inventory restricted to App Admin per global rules)
router.use(roleMiddleware());

// ✅ Apply tenant filtering
router.use(filterMiddleware);

router.get('/', inventoryItemsController.getAll);
router.get('/:id', inventoryItemsController.getById);
router.post('/', inventoryItemsController.create);
router.put('/:id', inventoryItemsController.update);
router.delete('/:id', inventoryItemsController.delete);

module.exports = router;
