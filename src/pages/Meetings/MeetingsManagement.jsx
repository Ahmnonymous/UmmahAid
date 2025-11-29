import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getAuditName } from "../../helpers/userStorage";
import { useRole } from "../../helpers/useRole";
import MeetingListPanel from "./components/MeetingListPanel";
import MeetingSummary from "./components/MeetingSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const MeetingsManagement = () => {
  // Meta title
  document.title = "Meetings Management | Welfare App";

  // State management
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const { centerId, isGlobalAdmin } = useRole();

  // Detail data states
  const [tasks, setTasks] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    taskStatuses: [],
  });

  // Create form
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: createIsSubmitting },
    reset: resetCreateForm,
  } = useForm();

  // Fetch all meetings on mount
  useEffect(() => {
    fetchMeetings();
    fetchLookupData();
    fetchEmployees();
  }, []);

  // Fetch detail data when a meeting is selected
  useEffect(() => {
    if (selectedMeeting) {
      fetchMeetingDetails(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/hseqToolboxMeeting`);
      setMeetings(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedMeeting(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      showAlert("Failed to fetch meetings", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [taskStatusesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Tasks_Status`),
      ]);

      setLookupData({
        taskStatuses: taskStatusesRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosApi.get(`${API_BASE_URL}/employee`);
      
      // Filter employees by center if not global admin
      const centerEmployees =
        isGlobalAdmin || centerId === null || centerId === undefined
          ? response.data
          : response.data.filter(
              (employee) =>
                String(employee.center_id ?? "") === String(centerId ?? "")
            );

      setEmployees(centerEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showAlert("Failed to fetch employees", "warning");
    }
  };

  const fetchMeetingDetails = async (meetingId) => {
    try {
      const [tasksRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/hseqToolboxMeetingTasks?meeting_id=${meetingId}`),
      ]);

      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      showAlert("Failed to fetch meeting details", "warning");
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

  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
    // Clear existing detail data to avoid showing stale records while fetching
    setTasks([]);
    // Fetch fresh detail data immediately for better UX
    if (meeting?.id) {
      fetchMeetingDetails(meeting.id);
    }
  };

  const handleMeetingUpdate = useCallback(() => {
    fetchMeetings();
    if (selectedMeeting) {
      fetchMeetingDetails(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedMeeting) {
      fetchMeetingDetails(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  const filteredMeetings = meetings.filter((meeting) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (meeting.conducted_by || "").toLowerCase().includes(searchLower) ||
      (meeting.in_attendance || "").toLowerCase().includes(searchLower) ||
      (meeting.meeting_date || "").toLowerCase().includes(searchLower)
    );
  });

  const toggleCreateModal = () => {
    setCreateModalOpen(!createModalOpen);
    if (!createModalOpen) {
      resetCreateForm({
        Meeting_Date: "",
        Conducted_By: "",
        In_Attendance: [],
        Guests: "",
        Health_Discussions: "",
        Safety_Discussions: "",
        Quality_Discussions: "",
        Productivity_Discussions: "",
        Environment_Discussions: "",
        General_Discussion: "",
        Feedback: "",
      });
    }
  };

  const onCreateSubmit = async (data) => {
    try {
      // Get employee name for conducted_by (now it's just an ID)
      const conductedByEmployee = employees.find(emp => emp.id === data.Conducted_By);
      const conductedByName = conductedByEmployee 
        ? `${conductedByEmployee.name} ${conductedByEmployee.surname}`.trim()
        : "";

      // Get employee names for in_attendance
      const inAttendanceIds = Array.isArray(data.In_Attendance) 
        ? data.In_Attendance.map(item => item?.value || item)
        : [];
      const inAttendanceNames = inAttendanceIds
        .map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? `${emp.name} ${emp.surname}`.trim() : null;
        })
        .filter(Boolean)
        .join(", ");

      const payload = {
        meeting_date: data.Meeting_Date,
        conducted_by: conductedByName,
        in_attendance: inAttendanceNames,
        guests: data.Guests,
        health_discussions: data.Health_Discussions,
        safety_discussions: data.Safety_Discussions,
        quality_discussions: data.Quality_Discussions,
        productivity_discussions: data.Productivity_Discussions,
        environment_discussions: data.Environment_Discussions,
        general_discussion: data.General_Discussion,
        feedback: data.Feedback,
        center_id: centerId ?? null,
        created_by: getAuditName(),
      };

      await axiosApi.post(`${API_BASE_URL}/hseqToolboxMeeting`, payload);
      showAlert("Meeting has been created successfully", "success");
      fetchMeetings();
      toggleCreateModal();
    } catch (error) {
      console.error("Error creating meeting:", error);
      showAlert(error?.response?.data?.error || "Failed to create meeting", "danger");
    }
  };

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

        <Breadcrumbs title="Meetings" breadcrumbItem="Meetings Management" />

        <Row>
          {/* Left Panel - Meeting List */}
          <Col lg={3}>
            <MeetingListPanel
              meetings={filteredMeetings}
              selectedMeeting={selectedMeeting}
              onSelectMeeting={handleMeetingSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchMeetings}
              onCreateNew={() => setCreateModalOpen(true)}
            />
          </Col>

          {/* Main Panel - Meeting Details */}
          <Col lg={9}>
            {selectedMeeting ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  meetings={meetings}
                  tasks={tasks}
                />

                {/* Meeting Summary */}
                <MeetingSummary
                  meeting={selectedMeeting}
                  lookupData={lookupData}
                  onUpdate={handleMeetingUpdate}
                  showAlert={showAlert}
                  employees={employees}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedMeeting.id}
                  meetingId={selectedMeeting.id}
                  tasks={tasks}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                  employees={employees}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-calendar display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading meetings..." : "Select a meeting to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>

        {/* Create Meeting Modal */}
        <Modal isOpen={createModalOpen} toggle={toggleCreateModal} centered size="lg" backdrop="static">
          <ModalHeader toggle={toggleCreateModal}>
            <i className="bx bx-plus-circle me-2"></i>
            Create New Meeting
          </ModalHeader>

          <Form onSubmit={handleCreateSubmit(onCreateSubmit)}>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="Meeting_Date">
                      Meeting Date <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Meeting_Date"
                      control={createControl}
                      rules={{ required: "Meeting date is required" }}
                      render={({ field }) => (
                        <Input id="Meeting_Date" type="date" invalid={!!createErrors.Meeting_Date} {...field} />
                      )}
                    />
                    {createErrors.Meeting_Date && <FormFeedback>{createErrors.Meeting_Date.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Conducted_By">
                      Conducted By <span className="text-danger">*</span>
                    </Label>
                    <Controller
                      name="Conducted_By"
                      control={createControl}
                      rules={{ required: "Conducted by is required" }}
                      render={({ field }) => (
                        <Input
                          id="Conducted_By"
                          type="select"
                          invalid={!!createErrors.Conducted_By}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const selectedId = e.target.value ? parseInt(e.target.value) : "";
                            field.onChange(selectedId);
                          }}
                        >
                          <option value="">Select employee...</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {`${employee.name} ${employee.surname}`.trim()}
                            </option>
                          ))}
                        </Input>
                      )}
                    />
                    {createErrors.Conducted_By && <FormFeedback>{createErrors.Conducted_By.message}</FormFeedback>}
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="In_Attendance">In Attendance</Label>
                    <Controller
                      name="In_Attendance"
                      control={createControl}
                      render={({ field }) => {
                        const employeeOptions = employees.map(employee => ({
                          value: employee.id,
                          label: `${employee.name} ${employee.surname}`.trim(),
                        }));

                        // Get computed styles for theme-aware colors
                        const getComputedStyle = () => {
                          if (typeof window !== 'undefined' && document.documentElement) {
                            const root = document.documentElement;
                            const isDark = root.getAttribute('data-bs-theme') === 'dark';
                            return {
                              controlBg: isDark ? '#212529' : '#fff',
                              menuBg: isDark ? '#212529' : '#fff',
                              inputColor: isDark ? '#fff' : '#000',
                              placeholderColor: isDark ? '#adb5bd' : '#6c757d',
                              multiValueBg: isDark ? '#495057' : '#e7f3ff',
                              multiValueLabelColor: isDark ? '#fff' : '#0066cc',
                              multiValueRemoveBg: isDark ? '#6c757d' : '#cfe2ff',
                              multiValueRemoveColor: isDark ? '#fff' : '#0066cc',
                              borderColor: isDark ? '#495057' : '#ced4da',
                              hoverBg: isDark ? '#343a40' : '#f8f9fa',
                            };
                          }
                          return {
                            controlBg: '#fff',
                            menuBg: '#fff',
                            inputColor: '#000',
                            placeholderColor: '#6c757d',
                            multiValueBg: '#e7f3ff',
                            multiValueLabelColor: '#0066cc',
                            multiValueRemoveBg: '#cfe2ff',
                            multiValueRemoveColor: '#0066cc',
                            borderColor: '#ced4da',
                            hoverBg: '#f8f9fa',
                          };
                        };

                        const themeColors = getComputedStyle();

                        return (
                          <Select
                            {...field}
                            isMulti
                            options={employeeOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Select employees..."
                            value={Array.isArray(field.value) 
                              ? field.value.map(val => {
                                  const id = val?.value || val;
                                  return employeeOptions.find(opt => opt.value === id);
                                }).filter(Boolean)
                              : []
                            }
                            onChange={(selected) => field.onChange(selected || [])}
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                backgroundColor: themeColors.controlBg,
                                borderColor: state.isFocused ? '#86b7fe' : themeColors.borderColor,
                                boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
                                '&:hover': {
                                  borderColor: state.isFocused ? '#86b7fe' : themeColors.borderColor,
                                },
                              }),
                              menu: (base) => ({
                                ...base,
                                backgroundColor: themeColors.menuBg,
                                borderColor: themeColors.borderColor,
                              }),
                              input: (base) => ({
                                ...base,
                                color: themeColors.inputColor,
                              }),
                              placeholder: (base) => ({
                                ...base,
                                color: themeColors.placeholderColor,
                              }),
                              singleValue: (base) => ({
                                ...base,
                                color: themeColors.inputColor,
                              }),
                              multiValue: (base) => ({
                                ...base,
                                backgroundColor: themeColors.multiValueBg,
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                color: themeColors.multiValueLabelColor,
                              }),
                              multiValueRemove: (base) => ({
                                ...base,
                                backgroundColor: themeColors.multiValueRemoveBg,
                                color: themeColors.multiValueRemoveColor,
                                '&:hover': {
                                  backgroundColor: themeColors.multiValueRemoveBg,
                                  color: themeColors.multiValueRemoveColor,
                                  opacity: 0.8,
                                },
                              }),
                              option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                  ? '#0d6efd'
                                  : state.isFocused
                                  ? themeColors.hoverBg
                                  : themeColors.menuBg,
                                color: state.isSelected ? '#fff' : themeColors.inputColor,
                                '&:active': {
                                  backgroundColor: '#0d6efd',
                                  color: '#fff',
                                },
                              }),
                            }}
                          />
                        );
                      }}
                    />
                    <small className="text-muted">Select one or more employees who attended the meeting</small>
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="Guests">Guests</Label>
                    <Controller
                      name="Guests"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Guests" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Health_Discussions">Health Discussions</Label>
                    <Controller
                      name="Health_Discussions"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Health_Discussions" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Safety_Discussions">Safety Discussions</Label>
                    <Controller
                      name="Safety_Discussions"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Safety_Discussions" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Quality_Discussions">Quality Discussions</Label>
                    <Controller
                      name="Quality_Discussions"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Quality_Discussions" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label for="Productivity_Discussions">Productivity Discussions</Label>
                    <Controller
                      name="Productivity_Discussions"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Productivity_Discussions" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="Environment_Discussions">Environment Discussions</Label>
                    <Controller
                      name="Environment_Discussions"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Environment_Discussions" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="General_Discussion">General Discussion</Label>
                    <Controller
                      name="General_Discussion"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="General_Discussion" type="textarea" rows="2" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <Label for="Feedback">Feedback</Label>
                    <Controller
                      name="Feedback"
                      control={createControl}
                      render={({ field }) => (
                        <Input id="Feedback" type="textarea" rows="3" {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>

            <ModalFooter className="d-flex justify-content-end">
              <Button color="light" onClick={toggleCreateModal} disabled={createIsSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={createIsSubmitting}>
                {createIsSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i> Create
                  </>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default MeetingsManagement;

