import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import DeleteConfirmationModal from "../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../hooks/useDeleteConfirmation";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getAuditName } from "../../../helpers/userStorage";

const MeetingSummary = ({ meeting, lookupData, onUpdate, showAlert, employees = [] }) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (meeting && modalOpen) {
      // Find employee for conducted_by by matching name
      const conductedByEmployee = employees.find(emp => {
        const fullName = `${emp.name} ${emp.surname}`.trim();
        return fullName === meeting.conducted_by;
      });
      const conductedByValue = conductedByEmployee ? conductedByEmployee.id : "";

      // Parse in_attendance (comma-separated names) to employee IDs
      const inAttendanceNames = meeting.in_attendance 
        ? meeting.in_attendance.split(',').map(name => name.trim()).filter(Boolean)
        : [];
      const inAttendanceValues = inAttendanceNames
        .map(name => {
          const emp = employees.find(e => {
            const fullName = `${e.name} ${e.surname}`.trim();
            return fullName === name;
          });
          return emp ? { value: emp.id, label: `${emp.name} ${emp.surname}`.trim() } : null;
        })
        .filter(Boolean);

      reset({
        Meeting_Date: meeting.meeting_date ? meeting.meeting_date.split('T')[0] : "",
        Conducted_By: conductedByValue,
        In_Attendance: inAttendanceValues,
        Guests: meeting.guests || "",
        Health_Discussions: meeting.health_discussions || "",
        Safety_Discussions: meeting.safety_discussions || "",
        Quality_Discussions: meeting.quality_discussions || "",
        Productivity_Discussions: meeting.productivity_discussions || "",
        Environment_Discussions: meeting.environment_discussions || "",
        General_Discussion: meeting.general_discussion || "",
        Feedback: meeting.feedback || "",
      });
    }
  }, [meeting, modalOpen, reset, employees]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleEdit = () => {
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
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
        updated_by: getAuditName(),
      };

      await axiosApi.put(`${API_BASE_URL}/hseqToolboxMeeting/${meeting.id}`, payload);
      showAlert("Meeting has been updated successfully", "success");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error updating meeting:", error);
      showAlert(error?.response?.data?.message || "Failed to update meeting", "danger");
    }
  };

  const handleDelete = () => {
    if (!meeting) return;

    const meetingName = `Meeting on ${meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'Unknown Date'} - ${meeting.conducted_by || 'Unknown'}`;
    
    showDeleteConfirmation({
      id: meeting.id,
      name: meetingName,
      type: "meeting",
      message: "This meeting will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/hseqToolboxMeeting/${meeting.id}`);
      showAlert("Meeting has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  return (
    <>
      <Card className="border shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-calendar me-2 text-primary"></i>
              Meeting Summary
            </h5>
            <div className="d-flex gap-2">
              <Button color="primary" size="sm" onClick={handleEdit} className="btn-sm">
                <i className="bx bx-edit-alt me-1"></i> Edit
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={handleDelete}
                className="btn-sm"
              >
                <i className="bx bx-trash me-1"></i> Delete
              </Button>
            </div>
          </div>
        </div>

        <CardBody className="py-3">
          {/* Flat summary grid: 4 fields per row */}
          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Meeting Date</p>
              <p className="mb-2 fw-medium font-size-12">
                {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : "-"}
              </p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Conducted By</p>
              <p className="mb-2 fw-medium font-size-12">{meeting.conducted_by || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Created By</p>
              <p className="mb-2 fw-medium font-size-12">{meeting.created_by || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Updated At</p>
              <p className="mb-2 fw-medium font-size-12">
                {meeting.updated_at ? new Date(meeting.updated_at).toLocaleDateString() : "-"}
              </p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={6}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">In Attendance</p>
              <p className="mb-2 fw-medium font-size-12">{meeting.in_attendance || "-"}</p>
            </Col>
            <Col md={6}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Guests</p>
              <p className="mb-2 fw-medium font-size-12">{meeting.guests || "-"}</p>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col md={12}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Feedback</p>
              <p className="mb-2 fw-medium font-size-12">{meeting.feedback || "-"}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-edit me-2"></i>
          Edit Meeting
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Meeting_Date">
                    Meeting Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Meeting_Date"
                    control={control}
                    rules={{ required: "Meeting date is required" }}
                    render={({ field }) => (
                      <Input id="Meeting_Date" type="date" invalid={!!errors.Meeting_Date} {...field} />
                    )}
                  />
                  {errors.Meeting_Date && <FormFeedback>{errors.Meeting_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Conducted_By">
                    Conducted By <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Conducted_By"
                    control={control}
                    rules={{ required: "Conducted by is required" }}
                    render={({ field }) => (
                      <Input
                        id="Conducted_By"
                        type="select"
                        invalid={!!errors.Conducted_By}
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
                  {errors.Conducted_By && <FormFeedback>{errors.Conducted_By.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="In_Attendance">In Attendance</Label>
                  <Controller
                    name="In_Attendance"
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
                    render={({ field }) => (
                      <Input id="Feedback" type="textarea" rows="3" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                <i className="bx bx-trash me-1"></i> Delete
              </Button>
            </div>
            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i> Save
                  </>
                )}
              </Button>
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Meeting"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default MeetingSummary;

