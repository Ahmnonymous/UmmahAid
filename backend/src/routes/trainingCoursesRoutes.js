const express = require('express');
const router = express.Router();
const trainingCoursesController = require('../controllers/trainingCoursesController');

router.get('/', trainingCoursesController.getAll);
router.get('/:id', trainingCoursesController.getById);
router.post('/', trainingCoursesController.create);
router.put('/:id', trainingCoursesController.update);
router.delete('/:id', trainingCoursesController.delete);

module.exports = router;
