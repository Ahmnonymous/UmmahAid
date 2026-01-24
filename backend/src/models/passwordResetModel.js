// models/passwordResetModel.js
const pool = require("../config/db");
const crypto = require("crypto");

const PasswordReset = {
  /**
   * Find user by email (checks Employee table)
   */
  findByEmail: async (email) => {
    try {
      const res = await pool.query(
        `SELECT e.id, e.email, e.username, e.name, e.surname
         FROM Employee e
         WHERE LOWER(e.email) = LOWER($1)`,
        [email]
      );
      
      if (res.rows.length > 0) {
        return {
          employee_id: res.rows[0].id,
          email: res.rows[0].email,
          username: res.rows[0].username,
          name: res.rows[0].name,
          surname: res.rows[0].surname,
        };
      }
      
      return null;
    } catch (err) {
      console.error("Error finding user by email:", err);
      throw err;
    }
  },

  /**
   * Create a password reset token
   */
  createToken: async (email, employeeId) => {
    try {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString("hex");
      
      // Token expires in 15 minutes
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Delete any existing unused tokens for this email
      await pool.query(
        "DELETE FROM Password_Reset_Tokens WHERE email = $1 AND used = false",
        [email]
      );
      
      // Insert new token
      const res = await pool.query(
        `INSERT INTO Password_Reset_Tokens (email, token, employee_id, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, token, expires_at, created_at`,
        [email, token, employeeId, expiresAt]
      );
      
      return res.rows[0];
    } catch (err) {
      console.error("Error creating password reset token:", err);
      throw err;
    }
  },

  /**
   * Find token by token string
   */
  findByToken: async (token) => {
    try {
      const res = await pool.query(
        `SELECT prt.*, e.id as employee_id, e.username
         FROM Password_Reset_Tokens prt
         LEFT JOIN Employee e ON prt.employee_id = e.id
         WHERE prt.token = $1`,
        [token]
      );
      
      return res.rows[0] || null;
    } catch (err) {
      console.error("Error finding token:", err);
      throw err;
    }
  },

  /**
   * Mark token as used
   */
  markAsUsed: async (token) => {
    try {
      await pool.query(
        "UPDATE Password_Reset_Tokens SET used = true WHERE token = $1",
        [token]
      );
    } catch (err) {
      console.error("Error marking token as used:", err);
      throw err;
    }
  },

  /**
   * Check if there's an active (unused and not expired) token for email
   */
  hasActiveToken: async (email) => {
    try {
      const res = await pool.query(
        `SELECT id FROM Password_Reset_Tokens
         WHERE email = $1 
         AND used = false 
         AND expires_at > NOW()`,
        [email]
      );
      
      return res.rows.length > 0;
    } catch (err) {
      console.error("Error checking active token:", err);
      throw err;
    }
  },

  /**
   * Update user password
   */
  updatePassword: async (employeeId, newPasswordHash) => {
    try {
      await pool.query(
        "UPDATE Employee SET Password_Hash = $1, Updated_At = NOW() WHERE id = $2",
        [newPasswordHash, employeeId]
      );
    } catch (err) {
      console.error("Error updating password:", err);
      throw err;
    }
  },
};

module.exports = PasswordReset;

