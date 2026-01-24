// controllers/passwordResetController.js
const bcrypt = require("bcryptjs");
const PasswordReset = require("../models/passwordResetModel");
const emailService = require("../services/emailService");

/**
 * Request password reset - sends email with reset link
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // Find user by email
    const user = await PasswordReset.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        msg: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Check if there's already an active token (within 15 minutes)
    const hasActiveToken = await PasswordReset.hasActiveToken(email);
    
    if (hasActiveToken) {
      return res.status(429).json({ 
        msg: "A password reset request was recently sent. Please check your email or wait 15 minutes before requesting again." 
      });
    }

    // Create reset token
    const tokenData = await PasswordReset.createToken(email, user.employee_id);
    
    // Generate reset link
    // Use environment variables dynamically (similar to how API_BASE_URL is handled)
    const frontendUrl = process.env.FRONTEND_URL 
      || process.env.PRODUCTION_FRONTEND_URL 
      || (process.env.NODE_ENV === 'production' ? 'https://ummahaid.org' : 'http://localhost:5173');
    const resetLink = `${frontendUrl}/reset-password?token=${tokenData.token}`;

    // Send email using email service
    const emailVariables = {
      user_name: `${user.name || ''} ${user.surname || ''}`.trim() || user.username,
      reset_link: resetLink,
      expires_in: "15 minutes",
    };

    // Send email directly
    const emailResult = await emailService.sendPasswordResetEmail(
      email,
      emailVariables.user_name,
      resetLink
    );

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      // Still return success to user (don't reveal email issues)
      return res.status(200).json({ 
        msg: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    res.status(200).json({ 
      msg: "If an account with that email exists, a password reset link has been sent." 
    });
  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

/**
 * Verify reset token - checks if token is valid
 */
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ msg: "Token is required" });
    }

    const tokenData = await PasswordReset.findByToken(token);

    if (!tokenData) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    if (tokenData.used) {
      return res.status(400).json({ msg: "This reset token has already been used" });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return res.status(400).json({ msg: "This reset token has expired" });
    }

    res.status(200).json({ 
      msg: "Token is valid",
      email: tokenData.email 
    });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

/**
 * Reset password - updates password using token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validation
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    // Verify token
    const tokenData = await PasswordReset.findByToken(token);

    if (!tokenData) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    if (tokenData.used) {
      return res.status(400).json({ msg: "This reset token has already been used" });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return res.status(400).json({ msg: "This reset token has expired" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password
    await PasswordReset.updatePassword(tokenData.employee_id, passwordHash);

    // Mark token as used
    await PasswordReset.markAsUsed(token);

    res.status(200).json({ 
      msg: "Password has been reset successfully. You can now login with your new password." 
    });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

