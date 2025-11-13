const express = require('express');
const router = express.Router();
const hseqToolboxMeetingTasksController = require('../controllers/hseqToolboxMeetingTasksController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware());
router.use(filterMiddleware);

router.get('/', hseqToolboxMeetingTasksController.getAll);
router.get('/:id', hseqToolboxMeetingTasksController.getById);
router.post('/', hseqToolboxMeetingTasksController.create);
router.put('/:id', hseqToolboxMeetingTasksController.update);
router.delete('/:id', hseqToolboxMeetingTasksController.delete);

module.exports = router;
