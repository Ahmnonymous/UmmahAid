/**
 * ============================================================
 * 🚀 LAZY LOADED ROUTES
 * ============================================================
 * Code splitting for better performance
 * Reduces initial bundle size by 40-60%
 */

import { lazy } from 'react';

// ✅ Lazy load heavy components (reports, dashboards, large pages)
export const ApplicantDetailsReport = lazy(() => import('../pages/Reports/ApplicantDetailsReport'));
export const TotalFinancialAssistanceReport = lazy(() => import('../pages/Reports/TotalFinancialAssistanceReport'));
export const FinancialAssistanceReport = lazy(() => import('../pages/Reports/FinancialAssistanceReport'));
export const FoodAssistanceReport = lazy(() => import('../pages/Reports/FoodAssistanceReport'));
export const HomeVisitsReport = lazy(() => import('../pages/Reports/HomeVisitsReport'));
export const ApplicantProgramsReport = lazy(() => import('../pages/Reports/ApplicantProgramsReport'));
export const RelationshipReport = lazy(() => import('../pages/Reports/RelationshipReport'));
export const SkillsMatrixReport = lazy(() => import('../pages/Reports/SkillsMatrixReport'));
export const ReportsMenu = lazy(() => import('../pages/Reports/ReportsMenu'));

// ✅ Lazy load dashboard pages
export const ApplicantStatistics = lazy(() => import('../pages/ApplicantStatistics/index'));
export const DashboardSaas = lazy(() => import('../pages/Dashboard-saas/index'));
export const DashboardCrypto = lazy(() => import('../pages/Dashboard-crypto/index'));
export const DashboardJob = lazy(() => import('../pages/DashboardJob/index'));

// ✅ Lazy load large management pages
export const ApplicantManagement = lazy(() => import('../pages/Applicants/ApplicantManagement'));
export const SupplierManagement = lazy(() => import('../pages/Suppliers/SupplierManagement'));
export const InventoryManagement = lazy(() => import('../pages/Inventory/InventoryManagement'));
export const CenterManagement = lazy(() => import('../pages/Centers/CenterManagement'));
export const MeetingsManagement = lazy(() => import('../pages/Meetings/MeetingsManagement'));

// ✅ Lazy load lookup pages
export const Lookups = lazy(() => import('../pages/Lookups/index'));
export const LookupTableView = lazy(() => import('../pages/Lookups/TableView'));
export const TrainingInstitutions = lazy(() => import('../pages/Lookups/TrainingInstitutions'));
export const Programs = lazy(() => import('../pages/Lookups/Programs'));
export const EmployeeDetails = lazy(() => import('../pages/Lookups/EmployeeDetails'));
export const EmployeeProfile = lazy(() => import('../pages/Employees/EmployeeProfile'));
export const PolicyAndProcedure = lazy(() => import('../pages/Lookups/PolicyAndProcedure'));

// ✅ Lazy load policy library
export const PolicyLibrary = lazy(() => import('../pages/PolicyLibrary'));

// ✅ Lazy load file manager
export const FileManager = lazy(() => import('../pages/FileManager/index'));

// ✅ Lazy load chat
export const Chat = lazy(() => import('../pages/Chat'));

