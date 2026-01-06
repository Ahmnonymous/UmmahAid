/**
 * ============================================================
 * 🚀 REDUX SELECTORS (Normalized Store)
 * ============================================================
 * Memoized selectors for efficient data access
 * Use reselect for memoization (already installed)
 */

import { createSelector } from 'reselect';

// Base selectors
const getEmployeesState = (state) => state.Employees || { byId: {}, allIds: [], loading: false, error: null };
const getEmployeesById = (state) => getEmployeesState(state).byId;
const getEmployeesAllIds = (state) => getEmployeesState(state).allIds;
const getEmployeesLoading = (state) => getEmployeesState(state).loading;
const getEmployeesError = (state) => getEmployeesState(state).error;

// ✅ Memoized selectors (only recompute when inputs change)
export const selectAllEmployees = createSelector(
  [getEmployeesById, getEmployeesAllIds],
  (byId, allIds) => {
    // Convert normalized structure back to array (for backward compatibility)
    return allIds.map((id) => byId[id]).filter(Boolean);
  }
);

export const selectEmployeeById = createSelector(
  [getEmployeesById, (state, employeeId) => employeeId],
  (byId, employeeId) => byId[employeeId] || null
);

export const selectEmployeesLoading = createSelector(
  [getEmployeesLoading],
  (loading) => loading
);

export const selectEmployeesError = createSelector(
  [getEmployeesError],
  (error) => error
);

export const selectEmployeesCount = createSelector(
  [getEmployeesAllIds],
  (allIds) => allIds.length
);

// Select employees by filter (e.g., by department, user_type)
export const selectEmployeesByFilter = createSelector(
  [getEmployeesById, getEmployeesAllIds, (state, filterFn) => filterFn],
  (byId, allIds, filterFn) => {
    if (!filterFn || typeof filterFn !== 'function') {
      return allIds.map((id) => byId[id]).filter(Boolean);
    }
    return allIds
      .map((id) => byId[id])
      .filter(Boolean)
      .filter(filterFn);
  }
);

