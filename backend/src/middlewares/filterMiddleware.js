// middlewares/filterMiddleware.js
// Automatically injects center_id from authenticated user into request context
// This ensures tenant isolation across all routes
//
// ✅ CORRECTED Role IDs:
// 1 = App Admin (SuperAdmin)
// 2 = HQ (multi-center access)
// 3 = Org Admin
// 4 = Org Executives
// 5 = Org Caseworkers

const { ROLES } = require('../constants/rbacMatrix');

module.exports = (req, res, next) => {
  try {
    // If user is authenticated and has a center_id, attach it to request
    if (req.user && req.user.center_id) {
      req.center_id = req.user.center_id;
      
      // ✅ FIXED: App Admin (user_type 1) and HQ (user_type 2) can access all centers
      const userType = parseInt(req.user.user_type);
      req.isSuperAdmin = userType === ROLES.APP_ADMIN; // Role 1
      req.isAppAdmin = userType === ROLES.APP_ADMIN;   // Role 1
      req.isHQ = userType === ROLES.HQ;                // Role 2
      req.isMultiCenter = userType === ROLES.APP_ADMIN || userType === ROLES.HQ; // 1 or 2
      
      // Log tenant context for debugging (remove in production)
      // console.log(`🔒 Tenant Filter: user=${req.user.username}, center=${req.center_id}, admin=${req.isSuperAdmin}, hq=${req.isHQ}`);
    }
    
    next();
  } catch (err) {
    console.error("❌ Filter middleware error:", err.message);
    next();
  }
};

