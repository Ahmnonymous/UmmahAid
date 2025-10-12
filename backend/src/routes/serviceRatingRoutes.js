const express = require('express');
const router = express.Router();
const serviceRatingController = require('../controllers/serviceRatingController');

router.get('/', serviceRatingController.getAll);
router.get('/:id', serviceRatingController.getById);
router.post('/', serviceRatingController.create);
router.put('/:id', serviceRatingController.update);
router.delete('/:id', serviceRatingController.delete);

module.exports = router;
