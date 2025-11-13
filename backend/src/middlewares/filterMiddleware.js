const {
  needsCenterRestriction,
  ROLE_KEY_BY_ID,
  ROLE_RULES,
} = require("../constants/rbacMatrix");
const { applyCenterFilter } = require("../utils/applyCenterFilter");

const ROLE_ID_BY_KEY = Object.entries(ROLE_KEY_BY_ID).reduce((acc, [id, key]) => {
  acc[key] = parseInt(id, 10);
  return acc;
}, {});

const parseRoleId = (user = {}) => {
  const potential = [
    user.user_type,
    user.role_id,
    user.roleId,
    user.role,
  ];

  for (const value of potential) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const direct = ROLE_RULES[value]?.id;
      if (direct) return direct;
      const trimmed = value.trim();
      if (ROLE_ID_BY_KEY[trimmed]) return ROLE_ID_BY_KEY[trimmed];
    }
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

module.exports = (req, res, next) => {
  try {
    if (req.user) {
      const roleId = parseRoleId(req.user);
      const roleKey = ROLE_KEY_BY_ID[roleId] || null;
      const enforceCenterFilter =
        req.accessScope?.enforceCenterFilter ?? needsCenterRestriction(roleId);

      const isAppAdmin = roleKey === "AppAdmin";
      const isHQ = roleKey === "HQ";
      const isGlobalAdmin = Boolean(isAppAdmin || isHQ);

      req.isSuperAdmin = isAppAdmin;
      req.isAppAdmin = isAppAdmin;
      req.isHQ = isHQ;
      req.isGlobalAdmin = isGlobalAdmin;
      req.isMultiCenter = !enforceCenterFilter;

      if (!enforceCenterFilter) {
        req.center_id = null;
      } else if (req.user.center_id !== null && req.user.center_id !== undefined) {
        const centerIdValue = parseInt(req.user.center_id, 10);
        req.center_id = Number.isNaN(centerIdValue) ? null : centerIdValue;
      } else {
        req.center_id = null;
      }

      req.applyCenterFilter = (query, options = {}) =>
        applyCenterFilter(query, { ...req.user, center_id: req.center_id }, {
          centerId: req.center_id,
          ...options,
        });
    }

    next();
  } catch (err) {
    console.error("❌ Filter middleware error:", err.message);
    next();
  }
};
