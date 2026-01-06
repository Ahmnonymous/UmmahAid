const dashboardModel = require('../models/dashboardModel');
const { cacheDashboard, invalidateDashboard } = require('../services/cacheService');

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
      
      // ✅ Cache dashboard statistics (5 minute TTL - balances freshness with performance)
      const statistics = await cacheDashboard(
        'applicant-statistics',
        centerId,
        () => dashboardModel.getApplicantStatistics(centerId, isSuperAdmin),
        300 // 5 minutes TTL
      );
      
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

      // ✅ Cache dashboard statistics with duration as part of cache key
      const cacheKey = `statistics-applications-${duration || 'all'}`;
      const data = await cacheDashboard(
        cacheKey,
        centerId,
        () => dashboardModel.getStatisticsApplications(duration, centerId, hasGlobalAccess),
        300 // 5 minutes TTL
      );
      
      res.json(data);
    } catch (err) {
      console.error('Error in getStatisticsApplications:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = dashboardController;

