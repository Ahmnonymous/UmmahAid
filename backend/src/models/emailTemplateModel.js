const pool = require("../config/db");

const tableName = "Email_Templates";

const emailTemplateModel = {
  /**
   * Get all email templates
   */
  getAll: async () => {
    try {
      const query = `SELECT * FROM ${tableName} ORDER BY template_name ASC`;
      const res = await pool.query(query);
      return res.rows.map((row) => {
        if (row.background_image && row.background_image_filename) {
          row.background_image = "exists";
        } else if (row.background_image) {
          row.background_image = row.background_image.toString("base64");
        }
        return row;
      });
    } catch (err) {
      throw new Error(
        `Error fetching all records from ${tableName}: ${err.message}`,
      );
    }
  },

  /**
   * Get template by ID
   */
  getById: async (id) => {
    try {
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const res = await pool.query(query, [id]);
      if (!res.rows[0]) return null;
      const row = res.rows[0];
      if (row.background_image && row.background_image_filename) {
        row.background_image = "exists";
      } else if (row.background_image) {
        row.background_image = row.background_image.toString("base64");
      }
      return row;
    } catch (err) {
      throw new Error(
        `Error fetching record by ID from ${tableName}: ${err.message}`,
      );
    }
  },

  /**
   * Get template by name
   */
  getByName: async (templateName) => {
    try {
      const query = `SELECT * FROM ${tableName} WHERE template_name = $1 AND is_active = true ORDER BY id DESC LIMIT 1`;
      const res = await pool.query(query, [templateName]);
      if (!res.rows[0]) return null;
      const row = res.rows[0];
      if (row.background_image && row.background_image_filename) {
        row.background_image = "exists";
      } else if (row.background_image) {
        row.background_image = row.background_image.toString("base64");
      }
      return row;
    } catch (err) {
      throw new Error(
        `Error fetching record by name from ${tableName}: ${err.message}`,
      );
    }
  },

  /**
   * Get template by trigger (table name and action)
   */
  getByTrigger: async (triggerTableName, action, statusId = null, recipientType = null) => {
    try {
      let query = `SELECT * FROM ${tableName} WHERE is_active = true`;
      const queryParams = [];
      
      if (recipientType) {
        query += ` AND recipient_type = $1`;
        queryParams.push(recipientType);
      }
      
      query += ` ORDER BY id DESC LIMIT 1`;
      
      const res = await pool.query(query, queryParams);
      if (!res.rows[0]) return null;
      
      const row = res.rows[0];
      if (row.background_image && row.background_image_filename) {
        row.background_image = "exists";
      } else if (row.background_image) {
        row.background_image = row.background_image.toString("base64");
      }
      return row;
    } catch (err) {
      throw new Error(
        `Error fetching record by trigger from ${tableName}: ${err.message}`,
      );
    }
  },
};

module.exports = emailTemplateModel;

