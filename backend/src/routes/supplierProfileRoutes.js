const express = require('express');
const router = express.Router();
const supplierProfileController = require('../controllers/supplierProfileController');
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply authentication, RBAC, and tenant filtering (supplier module restricted to App Admin)
router.use(authenticateToken);
router.use(roleMiddleware());
router.use(filterMiddleware);

router.get('/', supplierProfileController.getAll);
router.get('/:id', supplierProfileController.getById);
router.post('/', supplierProfileController.create);
router.put('/:id', supplierProfileController.update);
router.delete('/:id', supplierProfileController.delete);

module.exports = router;
