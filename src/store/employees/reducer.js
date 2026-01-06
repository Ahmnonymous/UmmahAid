import {
  FETCH_EMPLOYEES,
  FETCH_EMPLOYEES_SUCCESS,
  FETCH_EMPLOYEES_ERROR,
} from "./actionTypes";

/**
 * ============================================================
 * 🚀 NORMALIZED REDUX REDUCER
 * ============================================================
 * Stores entities by ID for efficient updates and lookups
 * Structure: { byId: { 1: {...}, 2: {...} }, allIds: [1, 2, ...] }
 * Benefits:
 * - O(1) lookups by ID
 * - Only update changed entities (no full array replacement)
 * - Reduced re-renders (components only update when their data changes)
 */

const INIT_STATE = {
  byId: {},      // Normalized: { employeeId: employeeData }
  allIds: [],    // Array of IDs in order
  loading: false,
  error: null,
};

// Helper: Normalize array to { byId, allIds } structure
const normalizeEmployees = (employeesArray) => {
  if (!Array.isArray(employeesArray)) {
    return { byId: {}, allIds: [] };
  }
  
  const byId = {};
  const allIds = [];
  
  employeesArray.forEach((employee) => {
    if (employee && employee.id != null) {
      byId[employee.id] = employee;
      allIds.push(employee.id);
    }
  });
  
  return { byId, allIds };
};

const employees = (state = INIT_STATE, action) => {
  switch (action.type) {
    case FETCH_EMPLOYEES:
      return { ...state, loading: true, error: null };
      
    case FETCH_EMPLOYEES_SUCCESS:
      // ✅ Normalize payload: convert array to { byId, allIds }
      const normalized = normalizeEmployees(action.payload);
      return {
        ...state,
        loading: false,
        byId: normalized.byId,
        allIds: normalized.allIds,
      };
      
    case FETCH_EMPLOYEES_ERROR:
      return { ...state, loading: false, error: action.payload };
      
    default:
      return state;
  }
};

export default employees;
