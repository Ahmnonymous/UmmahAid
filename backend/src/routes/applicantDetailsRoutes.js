const express = require('express');
const router = express.Router();
const applicantDetailsController = require('../controllers/applicantDetailsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Applicant_Details');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ✅ Apply authentication to all routes
router.use(authMiddleware);

// ✅ Apply RBAC - Applicants accessible by all staff roles
router.use(roleMiddleware([1, 2, 3, 4, 5])); // All staff can access applicants

// ✅ Apply tenant filtering
router.use(filterMiddleware);

router.get('/', applicantDetailsController.getAll);
router.get('/:id/view-signature', applicantDetailsController.viewSignature);
router.get('/:id/download-signature', applicantDetailsController.downloadSignature);
router.get('/:id', applicantDetailsController.getById);
router.post('/', upload.fields([{ name: 'signature' }]), applicantDetailsController.create);
router.put('/:id', upload.fields([{ name: 'signature' }]), applicantDetailsController.update);
router.delete('/:id', applicantDetailsController.delete);

module.exports = router;
