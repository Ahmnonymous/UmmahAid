const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');

router.get('/', foldersController.getAll);
router.get('/:id', foldersController.getById);
router.post('/', foldersController.create);
router.put('/:id', foldersController.update);
router.delete('/:id', foldersController.delete);

module.exports = router;
