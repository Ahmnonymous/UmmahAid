const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ Apply authentication to lookup routes
// Note: Lookups are global tables, so NO tenant filtering or RBAC
router.use(authMiddleware);

router.get('/:table', lookupController.getAll);
router.get('/:table/:id', lookupController.getById);
router.post('/:table', lookupController.create);
router.put('/:table/:id', lookupController.update);
router.delete('/:table/:id', lookupController.delete);

module.exports = router;
