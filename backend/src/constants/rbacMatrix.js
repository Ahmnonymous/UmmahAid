/**
 * RBAC Matrix - Centralized Role-Based Access Control Definitions
 * 
 * Role Hierarchy:
 * 1 = App Admin (SuperAdmin) - Global access, all centers, all operations
 * 2 = HQ - Multi-center access, all operations except center management
 * 3 = Org Admin - Full CRUD within own center
 * 4 = Org Executives - READ-ONLY within own center
 * 5 = Org Caseworkers - CRUD for Applicants & Tasks only within own center
 */

const ROLES = {
  APP_ADMIN: 1,
  HQ: 2,
  ORG_ADMIN: 3,
  ORG_EXECUTIVE: 4,
  ORG_CASEWORKER: 5,
};

const ROLE_DEFINITIONS = {
  1: {
    id: 1,
    name: "App Admin",
    label: "App Admin",
    access: "global",
    center_restriction: false,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: "all",
    description: "Super Admin - full access to all centers and all operations",
  },
  2: {
    id: 2,
    name: "HQ",
    label: "HQ",
    access: "multi-center",
    center_restriction: false,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: "all_except_centers",
    restricted_modules: ["Center_Detail"], // Cannot add/edit organizations
    description: "HQ - Access to all data except organization management",
  },
  3: {
    id: 3,
    name: "Org Admin",
    label: "Org Admin",
    access: "center-only",
    center_restriction: true,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: "all",
    description: "Organization Admin - Full CRUD within own center",
  },
  4: {
    id: 4,
    name: "Org Executive",
    label: "Org Executives",
    access: "center-only",
    center_restriction: true,
    allowed_methods: ["GET"], // READ-ONLY
    allowed_modules: "all",
    description: "Organization Executive - View-only access within own center",
  },
  5: {
    id: 5,
    name: "Org Caseworker",
    label: "Org Caseworkers",
    access: "center-only",
    center_restriction: true,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: ["Applicant_Details", "Tasks", "Comments", "Relationships", "Home_Visit", "Financial_Assistance", "Food_Assistance", "Attachments", "Programs", "Financial_Assessment", "Applicant_Income", "Applicant_Expense"],
    description: "Caseworker - CRUD for Applicants and Tasks only within own center",
  },
};

/**
 * Module to route mapping
 * Maps database tables/modules to API route prefixes
 */
const MODULE_ROUTE_MAP = {
  "Applicant_Details": "/api/applicantDetails",
  "Tasks": "/api/tasks",
  "Comments": "/api/comments",
  "Relationships": "/api/relationships",
  "Home_Visit": "/api/homeVisit",
  "Financial_Assistance": "/api/financialAssistance",
  "Food_Assistance": "/api/foodAssistance",
  "Attachments": "/api/attachments",
  "Programs": "/api/programs",
  "Financial_Assessment": "/api/financialAssessment",
  "Applicant_Income": "/api/applicantIncome",
  "Applicant_Expense": "/api/applicantExpense",
  "Employee": "/api/employee",
  "Inventory_Items": "/api/inventoryItems",
  "Inventory_Transactions": "/api/inventoryTransactions",
  "Supplier_Profile": "/api/supplierProfile",
  "Center_Detail": "/api/centerDetail",
};

/**
 * Get route module name from path
 */
function getModuleFromRoute(routePath) {
  const normalized = routePath.replace('/api/', '');
  const module = Object.keys(MODULE_ROUTE_MAP).find(key => 
    MODULE_ROUTE_MAP[key].includes(normalized)
  );
  return module || normalized;
}

/**
 * Check if user role can access route
 */
function canAccessRoute(userType, routePath) {
  const role = ROLE_DEFINITIONS[userType];
  if (!role) return false;
  
  // App Admin has global access
  if (userType === ROLES.APP_ADMIN) return true;
  
  const module = getModuleFromRoute(routePath);
  
  // HQ cannot access Center_Detail
  if (userType === ROLES.HQ && module === "Center_Detail") {
    return false;
  }
  
  // Caseworkers only access specific modules
  if (userType === ROLES.ORG_CASEWORKER) {
    return role.allowed_modules.includes(module);
  }
  
  return true;
}

/**
 * Check if user role can perform HTTP method
 */
function canPerformMethod(userType, method) {
  const role = ROLE_DEFINITIONS[userType];
  if (!role) return false;
  
  return role.allowed_methods.includes(method.toUpperCase());
}

/**
 * Check if user needs center restriction
 */
function needsCenterRestriction(userType) {
  const role = ROLE_DEFINITIONS[userType];
  if (!role) return true; // Default to restricted
  
  return role.center_restriction;
}

module.exports = {
  ROLES,
  ROLE_DEFINITIONS,
  MODULE_ROUTE_MAP,
  getModuleFromRoute,
  canAccessRoute,
  canPerformMethod,
  needsCenterRestriction,
};

