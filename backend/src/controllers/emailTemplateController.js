const emailTemplateModel = require('../models/emailTemplateModel');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const emailTemplateController = {
  getAll: async (req, res) => {
    try {
      const data = await emailTemplateModel.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await emailTemplateModel.getById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getByName: async (req, res) => {
    try {
      const { templateName } = req.params;
      const data = await emailTemplateModel.getByName(templateName);
      if (!data) return res.status(404).json({ error: 'Template not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  viewImage: async (req, res) => {
    try {
      // Get raw image directly from database (bypass model conversion)
      const pool = require('../config/db');
      const query = `SELECT background_image, background_image_mime, background_image_filename, background_image_show_link FROM Email_Templates WHERE id = $1`;
      const result = await pool.query(query, [req.params.id]);
      
      if (!result.rows[0]) {
        return res.status(404).send("Template not found");
      }
      
      if (!result.rows[0].background_image) {
        return res.status(404).send("No image found");
      }

      let buffer = result.rows[0].background_image;
      
      // Ensure it's a Buffer
      if (!Buffer.isBuffer(buffer)) {
        if (typeof buffer === "string") {
          if (buffer.startsWith("\\x")) {
            buffer = Buffer.from(buffer.slice(2), "hex");
          } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
            buffer = Buffer.from(buffer, "base64");
          } else {
            throw new Error("Unknown image encoding");
          }
        } else {
          throw new Error("Invalid image data type");
        }
      }

      if (!buffer || !buffer.length) {
        return res.status(500).send("Image buffer is empty or corrupted");
      }

      const mimeType = result.rows[0].background_image_mime || "image/png";
      const filename = result.rows[0].background_image_filename || "image";

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);

      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing image:", err);
      res.status(500).json({ error: "Error viewing image: " + err.message });
    }
  },
};

// Export multer upload middleware
emailTemplateController.upload = upload.single('background_image');

module.exports = emailTemplateController;

