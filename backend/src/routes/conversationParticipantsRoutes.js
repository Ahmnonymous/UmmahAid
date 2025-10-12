const express = require('express');
const router = express.Router();
const conversationParticipantsController = require('../controllers/conversationParticipantsController');

router.get('/', conversationParticipantsController.getAll);
router.get('/:id', conversationParticipantsController.getById);
router.post('/', conversationParticipantsController.create);
router.put('/:id', conversationParticipantsController.update);
router.delete('/:id', conversationParticipantsController.delete);

module.exports = router;
