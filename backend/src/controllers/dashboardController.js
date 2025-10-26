const dashboardModel = require('../models/dashboardModel');

const dashboardController = {
  getApplicantStatistics: async (req, res) => {
    try {
      // ✅ Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isSuperAdmin = req.isSuperAdmin;
      
      const statistics = await dashboardModel.getApplicantStatistics(centerId, isSuperAdmin);
      res.json(statistics);
    } catch (err) {
      console.error('Error in getApplicantStatistics:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = dashboardController;

