import React, { useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Row,
  Col,
  FormFeedback,
  Spinner,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getUmmahAidUser } from "../../../helpers/userStorage";

const ApplicantListPanel = ({
  applicants,
  selectedApplicant,
  onSelectApplicant,
  searchTerm,
  onSearchChange,
  loading,
  onRefresh,
  showAlert,
  lookupData,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Name: "",
      Surname: "",
      ID_Number: "",
      Date_of_Birth: "",
      Nationality: "",
      Gender: "",
      Race: "",
      Employment_Status: "",
      Skills: "",
      Highest_Education: "",
      Cell_Number: "",
      Alternate_Number: "",
      Email_Address: "",
      Street_Address: "",
      Suburb: "",
      Dwelling_Type: "",
      Dwelling_Status: "",
      Health_Conditions: "",
      Marital_Status: "",
      Date_Intake: "",
      File_Number: "",
      File_Condition: "",
      File_Status: "",
      Signature: null,
      Popia: false,
    },
  });

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      reset();
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getUmmahAidUser();
      const hasSignature = data.Signature && data.Signature.length > 0;

      if (hasSignature) {
        const formData = new FormData();
        formData.append("name", data.Name || "");
        formData.append("surname", data.Surname || "");
        formData.append("id_number", data.ID_Number || "");
        formData.append("date_of_birth", data.Date_of_Birth || "");
        formData.append("nationality", data.Nationality || "");
        formData.append("gender", data.Gender || "");
        formData.append("race", data.Race || "");
        formData.append("employment_status", data.Employment_Status || "");
        formData.append("skills", data.Skills || "");
        formData.append("highest_education_level", data.Highest_Education || "");
        formData.append("cell_number", data.Cell_Number || "");
        formData.append("alternate_number", data.Alternate_Number || "");
        formData.append("email_address", data.Email_Address || "");
        formData.append("street_address", data.Street_Address || "");
        formData.append("suburb", data.Suburb || "");
        formData.append("dwelling_type", data.Dwelling_Type || "");
        formData.append("dwelling_status", data.Dwelling_Status || "");
        formData.append("health", data.Health_Conditions || "");
        formData.append("marital_status", data.Marital_Status || "");
        formData.append("date_intake", data.Date_Intake || "");
        formData.append("file_number", data.File_Number || "");
        formData.append("file_condition", data.File_Condition || "");
        formData.append("file_status", data.File_Status || "");
        formData.append("signature", data.Signature[0]);
        formData.append("popia_agreement", data.Popia ? "Y" : "N");
        formData.append("created_by", currentUser?.username || "system");

        await axiosApi.post(`${API_BASE_URL}/applicantDetails`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const payload = {
          name: data.Name,
          surname: data.Surname,
          id_number: data.ID_Number,
          date_of_birth: data.Date_of_Birth || null,
          nationality: data.Nationality ? parseInt(data.Nationality) : null,
          gender: data.Gender ? parseInt(data.Gender) : null,
          race: data.Race ? parseInt(data.Race) : null,
          employment_status: data.Employment_Status ? parseInt(data.Employment_Status) : null,
          skills: data.Skills ? parseInt(data.Skills) : null,
          highest_education_level: data.Highest_Education ? parseInt(data.Highest_Education) : null,
          cell_number: data.Cell_Number,
          alternate_number: data.Alternate_Number,
          email_address: data.Email_Address,
          street_address: data.Street_Address,
          suburb: data.Suburb ? parseInt(data.Suburb) : null,
          dwelling_type: data.Dwelling_Type ? parseInt(data.Dwelling_Type) : null,
          dwelling_status: data.Dwelling_Status ? parseInt(data.Dwelling_Status) : null,
          health: data.Health_Conditions ? parseInt(data.Health_Conditions) : null,
          marital_status: data.Marital_Status ? parseInt(data.Marital_Status) : null,
          date_intake: data.Date_Intake || new Date().toISOString().split("T")[0],
          file_number: data.File_Number,
          file_condition: data.File_Condition ? parseInt(data.File_Condition) : null,
          file_status: data.File_Status ? parseInt(data.File_Status) : null,
          popia_agreement: data.Popia ? "Y" : "N",
          created_by: currentUser?.username || "system",
        };

        await axiosApi.post(`${API_BASE_URL}/applicantDetails`, payload);
      }
      showAlert("Applicant has been added successfully", "success");
      onRefresh();
      toggleModal();
    } catch (error) {
      console.error("Error creating applicant:", error);
      showAlert(error?.response?.data?.message || "Failed to create applicant", "danger");
    }
  };

  return (
    <Card className="border shadow-sm h-100">
      <CardBody className="p-0 d-flex flex-column">
        {/* Header */}
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="card-title mb-0 fw-semibold font-size-14">
                <i className="bx bx-users me-2 text-primary"></i>
                Applicants List
                {/* <span className="badge bg-soft-primary text-primary ms-2 font-size-10 px-2 py-1">
                 ({applicants.length})
                </span> */}
              </h6>
            </div>
            <Button 
              color="primary" 
              size="sm" 
              onClick={toggleModal} 
              className="btn-sm"
            >
              <i className="bx bx-plus font-size-12"></i>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="position-relative">
            <Input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-control form-control-sm"
            />
            <i className="bx bx-search-alt position-absolute top-50 end-0 translate-middle-y me-3 text-muted font-size-14"></i>
          </div>
        </div>

        {/* Applicant List - Fixed Height Scrollable */}
        <div className="flex-grow-1 p-3" style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}>
          {loading && (
            <div className="text-center py-4">
              <Spinner color="primary" size="sm" />
              <p className="mt-2 text-muted font-size-12">Loading...</p>
            </div>
          )}

          {!loading && applicants.length === 0 && (
            <div className="text-center py-4">
              <i className="bx bx-search-alt font-size-24 text-muted mb-2"></i>
              <h6 className="font-size-13 mb-1">No Applicants Found</h6>
              <p className="text-muted mb-0 font-size-11">Try adjusting your search</p>
            </div>
          )}

          {!loading && applicants.length > 0 && (
            <div className="d-flex flex-column gap-2">
              {applicants.map((applicant, index) => {
                const isSelected = selectedApplicant?.id === applicant.id;
                return (
                  <div
                    key={applicant.id}
                    className={`rounded border ${
                      isSelected 
                        ? 'border-primary bg-primary text-white shadow-sm' 
                        : 'border-light'
                    }`}
                    onClick={() => onSelectApplicant(applicant)}
                    style={{ 
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      padding: "12px 16px",
                      color: "inherit"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.classList.add('bg-light', 'border-primary', 'shadow-sm');
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.classList.remove('bg-light', 'border-primary', 'shadow-sm');
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <h6 className={`mb-1 font-size-13 fw-semibold ${
                          isSelected ? 'text-white' : ''
                        }`} style={{ color: "inherit" }}>
                          {applicant.name} {applicant.surname}
                        </h6>
                        <p className={`mb-0 font-size-11 ${
                          isSelected ? 'text-white-50' : 'text-muted'
                        }`}>
                          {applicant.id_number || "N/A"}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <i className="bx bx-check-circle font-size-16 text-white"></i>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardBody>

      {/* Add New Applicant Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-user-plus me-2"></i>
          Add New Applicant
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Name">
                    Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Name"
                    control={control}
                    rules={{ required: "Name is required" }}
                    render={({ field }) => (
                      <Input
                        id="Name"
                        type="text"
                        invalid={!!errors.Name}
                        {...field}
                      />
                    )}
                  />
                  {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Surname">
                    Surname <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Surname"
                    control={control}
                    rules={{ required: "Surname is required" }}
                    render={({ field }) => (
                      <Input
                        id="Surname"
                        type="text"
                        invalid={!!errors.Surname}
                        {...field}
                      />
                    )}
                  />
                  {errors.Surname && <FormFeedback>{errors.Surname.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="ID_Number">
                    ID Number <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="ID_Number"
                    control={control}
                    rules={{ required: "ID Number is required" }}
                    render={({ field }) => (
                      <Input
                        id="ID_Number"
                        type="text"
                        invalid={!!errors.ID_Number}
                        {...field}
                      />
                    )}
                  />
                  {errors.ID_Number && <FormFeedback>{errors.ID_Number.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_of_Birth">Date of Birth</Label>
                  <Controller
                    name="Date_of_Birth"
                    control={control}
                    render={({ field }) => (
                      <Input id="Date_of_Birth" type="date" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Nationality">Nationality</Label>
                  <Controller
                    name="Nationality"
                    control={control}
                    render={({ field }) => (
                      <Input id="Nationality" type="select" {...field}>
                        <option value="">Select Nationality</option>
                        {(lookupData.nationality || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Gender">Gender</Label>
                  <Controller
                    name="Gender"
                    control={control}
                    render={({ field }) => (
                      <Input id="Gender" type="select" {...field}>
                        <option value="">Select Gender</option>
                        {(lookupData.gender || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Race">Race</Label>
                  <Controller
                    name="Race"
                    control={control}
                    render={({ field }) => (
                      <Input id="Race" type="select" {...field}>
                        <option value="">Select Race</option>
                        {(lookupData.race || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Employment_Status">Employment Status</Label>
                  <Controller
                    name="Employment_Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="Employment_Status" type="select" {...field}>
                        <option value="">Select Status</option>
                        {(lookupData.employmentStatus || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Skills">Skills</Label>
                  <Controller
                    name="Skills"
                    control={control}
                    render={({ field }) => (
                      <Input id="Skills" type="select" {...field}>
                        <option value="">Select Skills</option>
                        {(lookupData.skills || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Highest_Education">Highest Education</Label>
                  <Controller
                    name="Highest_Education"
                    control={control}
                    render={({ field }) => (
                      <Input id="Highest_Education" type="select" {...field}>
                        <option value="">Select Education</option>
                        {(lookupData.educationLevel || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="File_Number">
                    File Number <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="File_Number"
                    control={control}
                    rules={{ required: "File Number is required" }}
                    render={({ field }) => (
                      <Input
                        id="File_Number"
                        type="text"
                        invalid={!!errors.File_Number}
                        {...field}
                      />
                    )}
                  />
                  {errors.File_Number && <FormFeedback>{errors.File_Number.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Cell_Number">Cell Number</Label>
                  <Controller
                    name="Cell_Number"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="Cell_Number"
                        type="text"
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Email_Address">Email Address</Label>
                  <Controller
                    name="Email_Address"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="Email_Address"
                        type="email"
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Street_Address">Street Address</Label>
                  <Controller
                    name="Street_Address"
                    control={control}
                    render={({ field }) => (
                      <Input id="Street_Address" type="text" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Suburb">Suburb</Label>
                  <Controller
                    name="Suburb"
                    control={control}
                    render={({ field }) => (
                      <Input id="Suburb" type="select" {...field}>
                        <option value="">Select Suburb</option>
                        {(lookupData.suburb || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Dwelling_Type">Dwelling Type</Label>
                  <Controller
                    name="Dwelling_Type"
                    control={control}
                    render={({ field }) => (
                      <Input id="Dwelling_Type" type="select" {...field}>
                        <option value="">Select Type</option>
                        {(lookupData.dwellingType || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Dwelling_Status">Dwelling Status</Label>
                  <Controller
                    name="Dwelling_Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="Dwelling_Status" type="select" {...field}>
                        <option value="">Select Status</option>
                        {(lookupData.dwellingStatus || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Health_Conditions">Health Conditions</Label>
                  <Controller
                    name="Health_Conditions"
                    control={control}
                    render={({ field }) => (
                      <Input id="Health_Conditions" type="select" {...field}>
                        <option value="">Select Condition</option>
                        {(lookupData.healthConditions || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Marital_Status">Marital Status</Label>
                  <Controller
                    name="Marital_Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="Marital_Status" type="select" {...field}>
                        <option value="">Select Status</option>
                        {(lookupData.maritalStatus || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_Intake">Date Intake</Label>
                  <Controller
                    name="Date_Intake"
                    control={control}
                    render={({ field }) => (
                      <Input id="Date_Intake" type="date" {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="File_Condition">File Condition</Label>
                  <Controller
                    name="File_Condition"
                    control={control}
                    render={({ field }) => (
                      <Input id="File_Condition" type="select" {...field}>
                        <option value="">Select Condition</option>
                        {(lookupData.fileCondition || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="File_Status">File Status</Label>
                  <Controller
                    name="File_Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="File_Status" type="select" {...field}>
                        <option value="">Select Status</option>
                        {(lookupData.fileStatus || []).map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Signature">Signature</Label>
                  <Controller
                    name="Signature"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input id="Signature" type="file" onChange={(e) => onChange(e.target.files)} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup check>
                  <Label check>
                    <Controller
                      name="Popia"
                      control={control}
                      render={({ field }) => (
                        <Input type="checkbox" {...field} checked={!!field.value} />
                      )}
                    />
                    <span className="ms-2">Popia</span>
                  </Label>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter>
            <Button color="light" onClick={toggleModal} disabled={isSubmitting}>
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
          </ModalFooter>
        </Form>
      </Modal>
    </Card>
  );
};

export default ApplicantListPanel;

