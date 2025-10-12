const express = require('express');
const router = express.Router();
const applicantDetailsController = require('../controllers/applicantDetailsController');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Applicant_Details');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/', applicantDetailsController.getAll);
router.get('/:id/view-signature', applicantDetailsController.viewSignature);
router.get('/:id/download-signature', applicantDetailsController.downloadSignature);
router.get('/:id', applicantDetailsController.getById);
router.post('/', upload.fields([{ name: 'signature' }]), applicantDetailsController.create);
router.put('/:id', upload.fields([{ name: 'signature' }]), applicantDetailsController.update);
router.delete('/:id', applicantDetailsController.delete);

module.exports = router;
