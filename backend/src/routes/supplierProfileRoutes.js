const express = require('express');
const router = express.Router();
const supplierProfileController = require('../controllers/supplierProfileController');

router.get('/', supplierProfileController.getAll);
router.get('/:id', supplierProfileController.getById);
router.post('/', supplierProfileController.create);
router.put('/:id', supplierProfileController.update);
router.delete('/:id', supplierProfileController.delete);

module.exports = router;
