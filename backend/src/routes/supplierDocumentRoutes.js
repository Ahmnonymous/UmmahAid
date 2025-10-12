const express = require('express');
const router = express.Router();
const supplierDocumentController = require('../controllers/supplierDocumentController');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Supplier_Document');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/', supplierDocumentController.getAll);
router.get('/:id/view-file', supplierDocumentController.viewFile);
router.get('/:id/download-file', supplierDocumentController.downloadFile);
router.get('/:id', supplierDocumentController.getById);
router.post('/', upload.fields([{ name: 'file' }]), supplierDocumentController.create);
router.put('/:id', upload.fields([{ name: 'file' }]), supplierDocumentController.update);
router.delete('/:id', supplierDocumentController.delete);

module.exports = router;
