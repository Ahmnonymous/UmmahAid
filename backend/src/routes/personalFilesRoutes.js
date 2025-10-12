const express = require('express');
const router = express.Router();
const personalFilesController = require('../controllers/personalFilesController');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Personal_Files');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/', personalFilesController.getAll);
router.get('/:id/view-file', personalFilesController.viewFile);
router.get('/:id/download-file', personalFilesController.downloadFile);
router.get('/:id', personalFilesController.getById);
router.post('/', upload.fields([{ name: 'file' }]), personalFilesController.create);
router.put('/:id', upload.fields([{ name: 'file' }]), personalFilesController.update);
router.delete('/:id', personalFilesController.delete);

module.exports = router;
