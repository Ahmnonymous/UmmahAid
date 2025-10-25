const express = require('express');
const router = express.Router();
const supplierProfileController = require('../controllers/supplierProfileController');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, supplierProfileController.getAll);
router.get('/:id', authenticateToken, supplierProfileController.getById);
router.post('/', authenticateToken, supplierProfileController.create);
router.put('/:id', authenticateToken, supplierProfileController.update);
router.delete('/:id', authenticateToken, supplierProfileController.delete);

module.exports = router;
