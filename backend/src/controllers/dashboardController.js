const dashboardModel = require('../models/dashboardModel');

const dashboardController = {
  getApplicantStatistics: async (req, res) => {
    try {
      // ✅ Apply tenant filtering based on role:
      // - App Admin: no center filter (global dashboards)
      // - HQ: filter by their assigned center (dashboard for their own center)
      // - Center-Based Roles: filter by their center (dashboard for their own center)
      const centerId = req.center_id || req.user?.center_id;
      // ✅ Only App Admin (role 1) gets global access - HQ and others filter by center
      const isSuperAdmin = req.isAppAdmin; // Use isAppAdmin (not isMultiCenter) so HQ filters by center
      
      const statistics = await dashboardModel.getApplicantStatistics(centerId, isSuperAdmin);
      res.json(statistics);
    } catch (err) {
      console.error('Error in getApplicantStatistics:', err);
      res.status(500).json({ error: err.message });
    }
  },

  getStatisticsApplications: async (req, res) => {
    try {
      const { duration } = req.query;
      const centerId = req.center_id ?? req.user?.center_id ?? null;
      const hasGlobalAccess = Boolean(req.isAppAdmin || req.isHQ);

      const data = await dashboardModel.getStatisticsApplications(duration, centerId, hasGlobalAccess);
      res.json(data);
    } catch (err) {
      console.error('Error in getStatisticsApplications:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = dashboardController;

