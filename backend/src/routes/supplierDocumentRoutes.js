const express = require('express');
const router = express.Router();
const supplierDocumentController = require('../controllers/supplierDocumentController');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Supplier_Document');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/', authenticateToken, supplierDocumentController.getAll);
router.get('/:id/view-file', supplierDocumentController.viewFile);
router.get('/:id/download-file', supplierDocumentController.downloadFile);
router.get('/:id', authenticateToken, supplierDocumentController.getById);
router.post('/', authenticateToken, upload.single('file'), supplierDocumentController.create);
router.put('/:id', authenticateToken, upload.single('file'), supplierDocumentController.update);
router.delete('/:id', authenticateToken, supplierDocumentController.delete);

module.exports = router;
