const express = require('express');
const router = express.Router();
const relationshipsController = require('../controllers/relationshipsController');

router.get('/', relationshipsController.getAll);
router.get('/:id', relationshipsController.getById);
router.post('/', relationshipsController.create);
router.put('/:id', relationshipsController.update);
router.delete('/:id', relationshipsController.delete);

module.exports = router;
