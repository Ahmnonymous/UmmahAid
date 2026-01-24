// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passwordResetController = require("../controllers/passwordResetController");

// ✅ Login
router.post("/login", authController.login);

// ✅ Password Reset Routes
router.post("/forgot-password", passwordResetController.requestPasswordReset);
router.get("/verify-reset-token/:token", passwordResetController.verifyResetToken);
router.post("/reset-password", passwordResetController.resetPassword);

module.exports = router;
