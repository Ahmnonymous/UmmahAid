// middlewares/roleMiddleware.js
// RBAC middleware to enforce role-based access control
// 
// ✅ CORRECTED Role IDs:
// 1 = App Admin (SuperAdmin) - Global access, all centers, all operations
// 2 = HQ - Multi-center access, all operations except center management
// 3 = Org Admin - Full CRUD within own center
// 4 = Org Executives - READ-ONLY within own center
// 5 = Org Caseworkers - CRUD Applicants & Tasks only within own center

const { ROLES, ROLE_DEFINITIONS, canAccessRoute, canPerformMethod, getModuleFromRoute } = require('../constants/rbacMatrix');

module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const userType = parseInt(req.user.user_type);
    const method = req.method;
    const routePath = req.baseUrl || req.path;
    
    // Convert roles array to integers for comparison
    const allowedRoles = roles.map(r => parseInt(r));
    
    // ✅ App Admin (role 1) bypasses ALL restrictions
    if (userType === ROLES.APP_ADMIN) {
      return next();
    }
    
    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(userType)) {
      return res.status(403).json({ 
        msg: "Forbidden: insufficient rights",
        required_roles: allowedRoles,
        your_role: userType,
        role_name: ROLE_DEFINITIONS[userType]?.label || 'Unknown'
      });
    }

    // ✅ Org Executives (role 4) - READ-ONLY enforcement
    if (userType === ROLES.ORG_EXECUTIVE) {
      if (!canPerformMethod(userType, method)) {
        return res.status(403).json({ 
          msg: "Forbidden: Executives have view-only access",
          your_role: userType,
          role_name: "Org Executive",
          allowed_methods: ["GET"],
          attempted_method: method
        });
      }
    }

    // ✅ Org Caseworkers (role 5) - Module restriction enforcement
    if (userType === ROLES.ORG_CASEWORKER) {
      if (!canAccessRoute(userType, routePath)) {
        return res.status(403).json({ 
          msg: "Forbidden: Caseworkers can only access Applicants and Tasks modules",
          your_role: userType,
          role_name: "Org Caseworker",
          allowed_modules: ROLE_DEFINITIONS[5].allowed_modules,
          attempted_route: routePath
        });
      }
    }

    // ✅ HQ (role 2) - Cannot access Center_Detail management
    if (userType === ROLES.HQ) {
      const module = getModuleFromRoute(routePath);
      if (module === "Center_Detail" && method !== "GET") {
        return res.status(403).json({ 
          msg: "Forbidden: HQ cannot manage organizations (add/edit centers)",
          your_role: userType,
          role_name: "HQ"
        });
      }
    }

    next();
  };
};
