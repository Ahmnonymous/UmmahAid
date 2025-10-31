const express = require('express');
const router = express.Router();
const centerAuditsController = require('../controllers/centerAuditsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Center_Audits');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ✅ Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', centerAuditsController.getAll);
router.get('/:id/view-attachment', centerAuditsController.viewAttachment);
router.get('/:id/download-attachment', centerAuditsController.downloadAttachment);
router.get('/:id', centerAuditsController.getById);
router.post('/', upload.fields([{ name: 'attachments' }]), centerAuditsController.create);
router.put('/:id', upload.fields([{ name: 'attachments' }]), centerAuditsController.update);
router.delete('/:id', centerAuditsController.delete);

module.exports = router;
