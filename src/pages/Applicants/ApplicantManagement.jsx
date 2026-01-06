import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert, Spinner } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import ApplicantListPanel from "./components/ApplicantListPanel";
import ApplicantSummary from "./components/ApplicantSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const ApplicantManagement = () => {
  // Meta title
  document.title = "Applicant Management | Welfare App";

  // State management
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  
  // ✅ Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // ✅ Detail loading state (for lazy loading)
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Detail data states
  const [comments, setComments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [homeVisits, setHomeVisits] = useState([]);
  const [financialAssistance, setFinancialAssistance] = useState([]);
  const [foodAssistance, setFoodAssistance] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [financialAssessment, setFinancialAssessment] = useState(null);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    race: [],
    nationality: [],
    gender: [],
    fileCondition: [],
    fileStatus: [],
    educationLevel: [],
    maritalStatus: [],
    employmentStatus: [],
    suburb: [],
    dwellingType: [],
    dwellingStatus: [],
    healthConditions: [],
    skills: [],
    bornReligion: [],
    periodAsMuslim: [],
    relationshipTypes: [],
    assistanceTypes: [],
    hampers: [],
    trainingCourses: [],
    meansOfCommunication: [],
    employees: [],
    trainingLevels: [],
    trainingInstitutions: [],
    trainingOutcomes: [],
    incomeTypes: [],
    expenseTypes: [],
  });

  // Fetch all applicants on mount
  useEffect(() => {
    fetchApplicants();
    fetchLookupData();
  }, []);

  // ✅ Lazy load detail data when applicant is selected (with slight delay for better UX)
  useEffect(() => {
    if (selectedApplicant) {
      // ✅ Small delay to allow UI to update first (perceived performance)
      const timer = setTimeout(() => {
        fetchApplicantDetails(selectedApplicant.id);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedApplicant]);

  // ✅ Debounced search to avoid too many API calls
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const fetchApplicants = async (page = 1, search = null) => {
    // Use provided search or current searchTerm
    const searchValue = search !== null ? search : searchTerm;
    try {
      setLoading(true);
      
      // ✅ Build query with pagination and server-side search
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      // ✅ Add search parameter if provided (server-side search)
      if (searchValue && searchValue.trim()) {
        params.append('search', searchValue.trim());
      }
      
      const response = await axiosApi.get(`${API_BASE_URL}/applicantDetails?${params.toString()}`);
      
      // ✅ Handle new paginated response format: { data: [...], pagination: {...} }
      const responseData = response.data;
      const applicantsData = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || []);
      
      // ✅ Update pagination state
      if (responseData?.pagination) {
        setPagination({
          page: responseData.pagination.page || page,
          limit: responseData.pagination.limit || 50,
          total: responseData.pagination.total || 0,
          totalPages: responseData.pagination.totalPages || 0,
          hasNext: responseData.pagination.hasNext || false,
          hasPrev: responseData.pagination.hasPrev || false,
        });
      }
      
      setApplicants(applicantsData);
      
      // ✅ Only auto-select first applicant if no applicant is currently selected
      if (applicantsData && applicantsData.length > 0 && !selectedApplicant) {
        setSelectedApplicant(applicantsData[0]);
      } else if (applicantsData.length === 0) {
        setSelectedApplicant(null);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
      showAlert("Failed to fetch applicants", "danger");
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ Debounced search handler
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // ✅ Debounce search: wait 500ms before fetching
    const timeout = setTimeout(() => {
      fetchApplicants(1, value); // Reset to page 1 on search
    }, 500);
    
    setSearchTimeout(timeout);
  };
  
  // ✅ Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchLookupData = async () => {
    try {
      const [
        raceRes,
        nationalityRes,
        genderRes,
        fileConditionRes,
        fileStatusRes,
        educationLevelRes,
        maritalStatusRes,
        employmentStatusRes,
        suburbRes,
        dwellingTypeRes,
        dwellingStatusRes,
        healthConditionsRes,
        skillsRes,
        bornReligionRes,
        periodAsMuslimRes,
        relationshipTypesRes,
        assistanceTypesRes,
        hampersRes,
        trainingCoursesRes,
        meansOfCommunicationRes,
        employeesRes,
        trainingLevelsRes,
        trainingInstitutionsRes,
        trainingOutcomesRes,
        incomeTypesRes,
        expenseTypesRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Race`),
        axiosApi.get(`${API_BASE_URL}/lookup/Nationality`),
        axiosApi.get(`${API_BASE_URL}/lookup/Gender`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Condition`),
        axiosApi.get(`${API_BASE_URL}/lookup/File_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Education_Level`),
        axiosApi.get(`${API_BASE_URL}/lookup/Marital_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Employment_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Suburb`),
        axiosApi.get(`${API_BASE_URL}/lookup/Dwelling_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/Dwelling_Status`),
        axiosApi.get(`${API_BASE_URL}/lookup/Health_Conditions`),
        axiosApi.get(`${API_BASE_URL}/lookup/Skills`),
        axiosApi.get(`${API_BASE_URL}/lookup/Born_Religion`),
        axiosApi.get(`${API_BASE_URL}/lookup/Period_As_Muslim`),
        axiosApi.get(`${API_BASE_URL}/lookup/Relationship_Types`),
        axiosApi.get(`${API_BASE_URL}/lookup/Assistance_Types`),
        axiosApi.get(`${API_BASE_URL}/lookup/Hampers`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Courses`),
        axiosApi.get(`${API_BASE_URL}/lookup/Means_of_communication`),
        axiosApi.get(`${API_BASE_URL}/employee`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Level`),
        axiosApi.get(`${API_BASE_URL}/trainingInstitutions`),
        axiosApi.get(`${API_BASE_URL}/lookup/Training_Outcome`),
        axiosApi.get(`${API_BASE_URL}/lookup/Income_Type`),
        axiosApi.get(`${API_BASE_URL}/lookup/Expense_Type`),
      ]);

      setLookupData({
        race: raceRes.data || [],
        nationality: nationalityRes.data || [],
        gender: genderRes.data || [],
        fileCondition: fileConditionRes.data || [],
        fileStatus: fileStatusRes.data || [],
        educationLevel: educationLevelRes.data || [],
        maritalStatus: maritalStatusRes.data || [],
        employmentStatus: employmentStatusRes.data || [],
        suburb: suburbRes.data || [],
        dwellingType: dwellingTypeRes.data || [],
        dwellingStatus: dwellingStatusRes.data || [],
        healthConditions: healthConditionsRes.data || [],
        skills: skillsRes.data || [],
        bornReligion: bornReligionRes.data || [],
        periodAsMuslim: periodAsMuslimRes.data || [],
        relationshipTypes: relationshipTypesRes.data || [],
        assistanceTypes: assistanceTypesRes.data || [],
        hampers: hampersRes.data || [],
        trainingCourses: trainingCoursesRes.data || [],
        meansOfCommunication: meansOfCommunicationRes.data || [],
        employees: employeesRes.data || [],
        trainingLevels: trainingLevelsRes.data || [],
        trainingInstitutions: trainingInstitutionsRes.data || [],
        trainingOutcomes: trainingOutcomesRes.data || [],
        incomeTypes: incomeTypesRes.data || [],
        expenseTypes: expenseTypesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchApplicantDetails = async (applicantId) => {
    if (!applicantId) return;
    
    try {
      setDetailsLoading(true);
      
      // ✅ Fetch detail data in parallel (optimized)
      const [
        commentsRes,
        tasksRes,
        relationshipsRes,
        homeVisitsRes,
        financialAssistanceRes,
        foodAssistanceRes,
        attachmentsRes,
        programsRes,
        financialAssessmentRes,
      ] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/comments?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/tasks?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/relationships?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/homeVisit?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/financialAssistance?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/foodAssistance?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/attachments?file_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/programs?person_trained_id=${applicantId}&page=1&limit=50`),
        axiosApi.get(`${API_BASE_URL}/financialAssessment?file_id=${applicantId}`),
      ]);

      // ✅ Helper function to extract data from paginated or array response
      const extractData = (responseData) => {
        if (Array.isArray(responseData)) {
          return responseData;
        }
        if (responseData?.data && Array.isArray(responseData.data)) {
          return responseData.data;
        }
        return [];
      };

      setComments(extractData(commentsRes.data));
      setTasks(extractData(tasksRes.data));
      setRelationships(extractData(relationshipsRes.data));
      setHomeVisits(extractData(homeVisitsRes.data));
      setFinancialAssistance(extractData(financialAssistanceRes.data));
      setFoodAssistance(extractData(foodAssistanceRes.data));
      setAttachments(extractData(attachmentsRes.data));
      setPrograms(extractData(programsRes.data));
      
      // Financial assessment might be an object or array
      const assessmentData = financialAssessmentRes.data;
      if (Array.isArray(assessmentData)) {
        setFinancialAssessment(assessmentData.length > 0 ? assessmentData[0] : null);
      } else if (assessmentData?.data && Array.isArray(assessmentData.data)) {
        setFinancialAssessment(assessmentData.data.length > 0 ? assessmentData.data[0] : null);
      } else {
        setFinancialAssessment(assessmentData || null);
      }
    } catch (error) {
      console.error("Error fetching applicant details:", error);
      showAlert("Failed to fetch applicant details", "warning");
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // ✅ Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchApplicants(newPage, searchTerm);
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const getAlertIcon = (color) => {
    switch (color) {
      case "success":
        return "mdi mdi-check-all";
      case "danger":
        return "mdi mdi-block-helper";
      case "warning":
        return "mdi mdi-alert-outline";
      case "info":
        return "mdi mdi-alert-circle-outline";
      default:
        return "mdi mdi-information";
    }
  };

  const getAlertBackground = (color) => {
    switch (color) {
      case "success":
        return "#d4edda";
      case "danger":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#d1ecf1";
      default:
        return "#f8f9fa";
    }
  };

  const getAlertBorder = (color) => {
    switch (color) {
      case "success":
        return "#c3e6cb";
      case "danger":
        return "#f5c6cb";
      case "warning":
        return "#ffeaa7";
      case "info":
        return "#bee5eb";
      default:
        return "#dee2e6";
    }
  };

  const handleApplicantSelect = (applicant) => {
    setSelectedApplicant(applicant);
    // Clear existing detail data to avoid showing stale records while fetching
    setComments([]);
    setTasks([]);
    setRelationships([]);
    setHomeVisits([]);
    setFinancialAssistance([]);
    setFoodAssistance([]);
    setAttachments([]);
    setPrograms([]);
    setFinancialAssessment(null);
    // Fetch fresh detail data immediately for better UX
    if (applicant?.id) {
      fetchApplicantDetails(applicant.id);
    }
  };

  const handleApplicantUpdate = useCallback(() => {
    fetchApplicants(pagination.page, searchTerm);
    if (selectedApplicant) {
      fetchApplicantDetails(selectedApplicant.id);
    }
  }, [selectedApplicant, pagination.page, searchTerm]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedApplicant) {
      fetchApplicantDetails(selectedApplicant.id);
    }
  }, [selectedApplicant]);

  // ✅ Server-side search is now handled in fetchApplicants
  // No need for client-side filtering when using server-side search
  // Keep filteredApplicants for backward compatibility (if search is empty, show all)
  const filteredApplicants = searchTerm 
    ? applicants // Server already filtered, just use as-is
    : applicants;

  return (
    <div className="page-content">
      <Container fluid>
        {/* Alert Notification - Top Right */}
        {alert && (
          <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
          >
            <Alert
              color={alert.color}
              isOpen={!!alert}
              toggle={() => setAlert(null)}
              className="alert-dismissible fade show shadow-lg"
              role="alert"
              style={{
                opacity: 1,
                backgroundColor: getAlertBackground(alert.color),
                border: `1px solid ${getAlertBorder(alert.color)}`,
                color: "#000",
              }}
            >
              <i className={`${getAlertIcon(alert.color)} me-2`}></i>
              {alert.message}
            </Alert>
          </div>
        )}

        <Breadcrumbs title="Applicants" breadcrumbItem="Applicant Management" />

        <Row>
          {/* Left Panel - Applicant List */}
          <Col lg={3}>
            <ApplicantListPanel
              applicants={filteredApplicants}
              selectedApplicant={selectedApplicant}
              onSelectApplicant={handleApplicantSelect}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              loading={loading}
              onRefresh={() => fetchApplicants(pagination.page, searchTerm)}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </Col>

          {/* Main Panel - Applicant Details */}
          <Col lg={9}>
            {selectedApplicant ? (
              <>
                {detailsLoading && (
                  <div className="text-center py-3 mb-3">
                    <Spinner color="primary" size="sm" />
                    <span className="ms-2 text-muted">Loading details...</span>
                  </div>
                )}
                
                {/* Summary Metrics */}
                <SummaryMetrics
                  applicantId={selectedApplicant.id}
                  financialAssistance={financialAssistance}
                  foodAssistance={foodAssistance}
                  homeVisits={homeVisits}
                  programs={programs}
                />

                {/* Applicant Summary */}
                <ApplicantSummary
                  applicant={selectedApplicant}
                  lookupData={lookupData}
                  onUpdate={handleApplicantUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedApplicant.id}
                  applicantId={selectedApplicant.id}
                  applicant={selectedApplicant}
                  comments={comments}
                  tasks={tasks}
                  relationships={relationships}
                  homeVisits={homeVisits}
                  financialAssistance={financialAssistance}
                  foodAssistance={foodAssistance}
                  attachments={attachments}
                  programs={programs}
                  financialAssessment={financialAssessment}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-user-circle display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading applicants..." : "Select an applicant to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ApplicantManagement;

