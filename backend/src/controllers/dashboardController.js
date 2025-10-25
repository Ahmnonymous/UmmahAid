const dashboardModel = require('../models/dashboardModel');

const dashboardController = {
  getApplicantStatistics: async (req, res) => {
    try {
      const statistics = await dashboardModel.getApplicantStatistics();
      res.json(statistics);
    } catch (err) {
      console.error('Error in getApplicantStatistics:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = dashboardController;

