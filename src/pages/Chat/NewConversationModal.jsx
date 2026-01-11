import React from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";

const NewConversationModal = ({
  isOpen,
  toggle,
  employees,
  currentUser,
  onSubmit,
  showAlert,
  isAppAdmin,
  isHQ,
  isOrgAdmin,
  isCaseworker,
  userType,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      type: "Group",
      participants: [],
    },
  });

  const conversationType = watch("type");

  const handleFormSubmit = async (data) => {
    try {
      const participantCount = data.participants ? data.participants.length : 0;
      
      if (data.type === "Group") {
        if (participantCount === 0) {
          showAlert("Please select at least one participant for a group conversation", "warning");
          return;
        }
        if (participantCount === 1) {
          showAlert("A group conversation requires at least 2 participants. Please create a Direct conversation instead for one-on-one messaging.", "warning");
          return;
        }
      }

      if (data.type === "Direct" && participantCount !== 1) {
        showAlert("Please select exactly one participant for a direct conversation", "warning");
        return;
      }

      const participantIds = data.participants ? data.participants.map(p => p.value) : [];
      
      await onSubmit({
        title: data.type === "Direct" ? "" : data.title, // Empty title for Direct conversations
        type: data.type,
        participants: participantIds,
      });

      reset();
    } catch (error) {
      console.error("Error creating conversation:", error);
      showAlert("Failed to create conversation", "danger");
    }
  };

  // Determine if current user can create Announcements (only App Admin and HQ)
  const canCreateAnnouncement = isAppAdmin || isHQ;
  
  // Determine if current user is Org Admin or Caseworker (restricted participant selection)
  const isRestrictedUser = isOrgAdmin || isCaseworker;

  // Filter employee list based on user type and restrictions
  const employeeOptions = employees
    .filter(employee => {
      // Exclude current user
      if (employee.id == currentUser?.id) return false; // Use loose equality to handle string/number mismatch
      
      // Exclude org executives (user_type 4) - they don't have access to Chat module
      const empUserType = employee.user_type || employee.User_Type || employee.userType;
      if (empUserType == 4 || empUserType === "4") return false; // Use loose equality to handle string/number mismatch
      
      // If current user is Org Admin or Caseworker, they can only select other Org Admins and Caseworkers
      // (Cannot select App Admin or HQ)
      if (isRestrictedUser) {
        // Only allow Org Admin (user_type 3) and Caseworker (user_type 5)
        if (empUserType != 3 && empUserType != 5 && empUserType !== "3" && empUserType !== "5") {
          return false;
        }
      }
      
      return true;
    })
    .map(employee => ({
      value: employee.id,
      label: `${employee.name} ${employee.surname}`,
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
    <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" size="md">
      <ModalHeader toggle={toggle}>
        <i className="bx bx-plus-circle me-2"></i>
        New Conversation
      </ModalHeader>

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalBody>
          {/* Type field first */}
          <FormGroup>
            <Label for="type">
              Conversation Type <span className="text-danger">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Type is required" }}
              render={({ field }) => (
                <Input id="type" type="select" invalid={!!errors.type} {...field}>
                  <option value="Group">Group</option>
                  <option value="Direct">Direct</option>
                  {canCreateAnnouncement && <option value="Announcement">Announcement</option>}
                </Input>
              )}
            />
            {errors.type && <FormFeedback>{errors.type.message}</FormFeedback>}
            <small className="text-muted">
              {conversationType === "Group" && "Group chat with multiple participants"}
              {conversationType === "Direct" && "One-on-one conversation"}
              {conversationType === "Announcement" && "Broadcast messages to all"}
            </small>
          </FormGroup>

          {/* Title field - only show for Group and Announcement, not Direct */}
          {conversationType !== "Direct" && (
            <FormGroup>
              <Label for="title">
                Conversation Title <span className="text-danger">*</span>
              </Label>
              <Controller
                name="title"
                control={control}
                rules={{ required: conversationType !== "Direct" ? "Title is required" : false }}
                render={({ field }) => (
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter conversation title"
                    invalid={!!errors.title}
                    {...field}
                  />
                )}
              />
              {errors.title && <FormFeedback>{errors.title.message}</FormFeedback>}
            </FormGroup>
          )}

          {conversationType === "Group" && (
            <FormGroup>
              <Label for="participants">
                Participants <span className="text-danger">*</span>
              </Label>
              <Controller
                name="participants"
                control={control}
                rules={{
                  required: "Please select participants for the group conversation",
                  validate: (value) => {
                    const count = value ? value.length : 0;
                    if (count === 0) {
                      return "Please select at least 2 participants for a group conversation";
                    }
                    if (count === 1) {
                      return "A group conversation requires at least 2 participants. Please use Direct conversation for one-on-one messaging.";
                    }
                    return true;
                  }
                }}
                render={({ field, fieldState }) => (
                  <div>
                    <Select
                      {...field}
                      isMulti
                      options={employeeOptions}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder="Select participants..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          backgroundColor: themeColors.controlBg,
                          borderColor: fieldState.error 
                            ? '#dc3545' 
                            : state.isFocused 
                            ? '#86b7fe' 
                            : themeColors.borderColor,
                          boxShadow: fieldState.error
                            ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)'
                            : state.isFocused 
                            ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' 
                            : 'none',
                          '&:hover': {
                            borderColor: fieldState.error 
                              ? '#dc3545' 
                              : state.isFocused 
                              ? '#86b7fe' 
                              : themeColors.borderColor,
                          },
                        }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: themeColors.menuBg,
                        borderColor: themeColors.borderColor,
                        zIndex: 9999,
                      }),
                      menuList: (base) => ({
                        ...base,
                        backgroundColor: themeColors.menuBg,
                        padding: 0,
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
                  </div>
                )}
              />
              {errors.participants && (
                <FormFeedback className="d-block" style={{ display: 'block !important' }}>
                  {errors.participants.message}
                </FormFeedback>
              )}
              <small className="text-muted">
                Select at least 2 employees to add to this group conversation
              </small>
            </FormGroup>
          )}

          {conversationType === "Direct" && (
            <FormGroup>
              <Label for="participants">
                Select Participant <span className="text-danger">*</span>
              </Label>
              <Controller
                name="participants"
                control={control}
                rules={{ 
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return "Please select one participant";
                    }
                    if (value.length > 1) {
                      return "Please select only one participant for direct conversation";
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti={false}
                    options={employeeOptions}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select one person..."
                    onChange={(selected) => {
                      // Convert single selection to array format for consistency
                      field.onChange(selected ? [selected] : []);
                    }}
                    value={field.value && field.value.length > 0 ? field.value[0] : null}
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
                        zIndex: 9999,
                      }),
                      menuList: (base) => ({
                        ...base,
                        backgroundColor: themeColors.menuBg,
                        padding: 0,
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
                )}
              />
              {errors.participants && <FormFeedback>{errors.participants.message}</FormFeedback>}
              <small className="text-muted">
                Select one person for direct messaging
              </small>
            </FormGroup>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            color="light"
            onClick={() => {
              reset();
              toggle();
            }}
            disabled={isSubmitting}
          >
            <i className="bx bx-x me-1"></i>
            Cancel
          </Button>
          <Button color="success" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Creating...
              </>
            ) : (
              <>
                <i className="bx bx-check me-1"></i>
                Create Conversation
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default NewConversationModal;

