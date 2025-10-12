const express = require('express');
const router = express.Router();
const centerDetailController = require('../controllers/centerDetailController');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Center_Detail');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/', centerDetailController.getAll);
router.get('/:id/view-logo', centerDetailController.viewLogo);
router.get('/:id/download-logo', centerDetailController.downloadLogo);
router.get('/:id/view-qrcode', centerDetailController.viewQRCode);
router.get('/:id/download-qrcode', centerDetailController.downloadQRCode);
router.get('/:id', centerDetailController.getById);
router.post('/', upload.fields([{ name: 'logo' }, { name: 'qr_code_service_url' }]), centerDetailController.create);
router.put('/:id', upload.fields([{ name: 'logo' }, { name: 'qr_code_service_url' }]), centerDetailController.update);
router.delete('/:id', centerDetailController.delete);

module.exports = router;
