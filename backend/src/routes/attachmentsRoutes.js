const express = require('express');
const router = express.Router();
const attachmentsController = require('../controllers/attachmentsController');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Attachments');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/', attachmentsController.getAll);
router.get('/:id/view-file', attachmentsController.viewFile);
router.get('/:id/download-file', attachmentsController.downloadFile);
router.get('/:id', attachmentsController.getById);
router.post('/', upload.fields([{ name: 'file' }]), attachmentsController.create);
router.put('/:id', upload.fields([{ name: 'file' }]), attachmentsController.update);
router.delete('/:id', attachmentsController.delete);

module.exports = router;
