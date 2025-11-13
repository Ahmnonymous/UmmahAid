const express = require('express');
const router = express.Router();
const hseqToolboxMeetingController = require('../controllers/hseqToolboxMeetingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware());
router.use(filterMiddleware);

router.get('/', hseqToolboxMeetingController.getAll);
router.get('/:id', hseqToolboxMeetingController.getById);
router.post('/', hseqToolboxMeetingController.create);
router.put('/:id', hseqToolboxMeetingController.update);
router.delete('/:id', hseqToolboxMeetingController.delete);

module.exports = router;
