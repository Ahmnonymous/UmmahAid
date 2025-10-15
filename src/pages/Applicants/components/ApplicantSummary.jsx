import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useForm, Controller } from "react-hook-form";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";
import { getUmmahAidUser } from "../../../helpers/userStorage";

const ApplicantSummary = ({ applicant, lookupData, onUpdate, showAlert }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (applicant && modalOpen) {
      reset({
        Name: applicant.name || "",
        Surname: applicant.surname || "",
        ID_Number: applicant.id_number || "",
        Race: applicant.race || "",
        Nationality: applicant.nationality || "",
        Nationality_Expiry_Date: applicant.nationality_expiry_date || "",
        Gender: applicant.gender || "",
        Born_Religion_ID: applicant.born_religion_id || "",
        Period_As_Muslim_ID: applicant.period_as_muslim_id || "",
        File_Number: applicant.file_number || "",
        File_Condition: applicant.file_condition || "",
        File_Status: applicant.file_status || "",
        Date_Intake: applicant.date_intake || "",
        Highest_Education_Level: applicant.highest_education_level || "",
        Marital_Status: applicant.marital_status || "",
        Employment_Status: applicant.employment_status || "",
        Cell_Number: applicant.cell_number || "",
        Alternate_Number: applicant.alternate_number || "",
        Email_Address: applicant.email_address || "",
        Suburb: applicant.suburb || "",
        Street_Address: applicant.street_address || "",
        Dwelling_Type: applicant.dwelling_type || "",
        Flat_Name: applicant.flat_name || "",
        Flat_Number: applicant.flat_number || "",
        Dwelling_Status: applicant.dwelling_status || "",
        Health: applicant.health || "",
        Skills: applicant.skills || "",
        POPIA_Agreement: applicant.popia_agreement || "",
      });
    }
  }, [applicant, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      setActiveTab("1");
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getUmmahAidUser();

      const payload = {
        name: data.Name,
        surname: data.Surname,
        id_number: data.ID_Number,
        race: data.Race ? parseInt(data.Race) : null,
        nationality: data.Nationality ? parseInt(data.Nationality) : null,
        nationality_expiry_date: data.Nationality_Expiry_Date || null,
        gender: data.Gender ? parseInt(data.Gender) : null,
        born_religion_id: data.Born_Religion_ID ? parseInt(data.Born_Religion_ID) : null,
        period_as_muslim_id: data.Period_As_Muslim_ID ? parseInt(data.Period_As_Muslim_ID) : null,
        file_number: data.File_Number,
        file_condition: data.File_Condition ? parseInt(data.File_Condition) : null,
        file_status: data.File_Status ? parseInt(data.File_Status) : null,
        date_intake: data.Date_Intake || null,
        highest_education_level: data.Highest_Education_Level ? parseInt(data.Highest_Education_Level) : null,
        marital_status: data.Marital_Status ? parseInt(data.Marital_Status) : null,
        employment_status: data.Employment_Status ? parseInt(data.Employment_Status) : null,
        cell_number: data.Cell_Number,
        alternate_number: data.Alternate_Number,
        email_address: data.Email_Address,
        suburb: data.Suburb ? parseInt(data.Suburb) : null,
        street_address: data.Street_Address,
        dwelling_type: data.Dwelling_Type ? parseInt(data.Dwelling_Type) : null,
        flat_name: data.Flat_Name,
        flat_number: data.Flat_Number,
        dwelling_status: data.Dwelling_Status ? parseInt(data.Dwelling_Status) : null,
        health: data.Health ? parseInt(data.Health) : null,
        skills: data.Skills ? parseInt(data.Skills) : null,
        popia_agreement: data.POPIA_Agreement,
        updated_by: currentUser?.username || "system",
      };

      await axiosApi.put(`${API_BASE_URL}/applicantDetails/${applicant.id}`, payload);
      showAlert("Applicant has been updated successfully", "success");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error updating applicant:", error);
      showAlert(error?.response?.data?.message || "Failed to update applicant", "danger");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosApi.delete(`${API_BASE_URL}/applicantDetails/${applicant.id}`);
      showAlert("Applicant has been deleted successfully", "danger");
      onUpdate();
      setDeleteConfirm(false);
      toggleModal();
    } catch (error) {
      console.error("Error deleting applicant:", error);
      showAlert(error?.response?.data?.message || "Failed to delete applicant", "danger");
    }
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  return (
    <>
      <Card className="border shadow-sm">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-user me-2 text-primary"></i>
              Applicant Summary
            </h5>
            <Button color="primary" size="sm" onClick={toggleModal} className="btn-sm">
              <i className="bx bx-edit-alt me-1"></i> Edit
            </Button>
          </div>
        </div>

        <CardBody className="py-3">
          {/* Flat summary grid: 4 fields per row */}
          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Name</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.name || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Surname</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.surname || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">File Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.file_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">ID Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.id_number || "-"}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Date Intake</p>
              <p className="mb-2 fw-medium font-size-12">{formatDate(applicant.date_intake)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Race</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.race, applicant.race)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Nationality</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.nationality, applicant.nationality)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Gender</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.gender, applicant.gender)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Marital Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.maritalStatus, applicant.marital_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Employment Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.employmentStatus, applicant.employment_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Born Religion</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.bornReligion, applicant.born_religion_id)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Period as Muslim</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.periodAsMuslim, applicant.period_as_muslim_id)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Cell Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.cell_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Alternate Number</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.alternate_number || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Email Address</p>
              <p className="mb-2 fw-medium font-size-12 text-break">{applicant.email_address || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Suburb</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.suburb, applicant.suburb)}</p>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Street Address</p>
              <p className="mb-2 fw-medium font-size-12">{applicant.street_address || "-"}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Dwelling Type</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.dwellingType, applicant.dwelling_type)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Dwelling Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.dwellingStatus, applicant.dwelling_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Education Level</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.educationLevel, applicant.highest_education_level)}</p>
            </Col>
          </Row>

          <Row className="mb-0">
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">File Condition</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.fileCondition, applicant.file_condition)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">File Status</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.fileStatus, applicant.file_status)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Health Condition</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.healthConditions, applicant.health)}</p>
            </Col>
            <Col md={3}>
              <p className="text-muted mb-1 font-size-11 text-uppercase">Skills</p>
              <p className="mb-2 fw-medium font-size-12">{getLookupName(lookupData.skills, applicant.skills)}</p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="xl" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className="bx bx-edit me-2"></i>
          Edit Applicant - {applicant.name} {applicant.surname}
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "1" })}
                  onClick={() => toggleTab("1")}
                  style={{ cursor: "pointer" }}
                >
                  Personal Info
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "2" })}
                  onClick={() => toggleTab("2")}
                  style={{ cursor: "pointer" }}
                >
                  Contact & Address
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "3" })}
                  onClick={() => toggleTab("3")}
                  style={{ cursor: "pointer" }}
                >
                  File Details
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="pt-3">
              <TabPane tabId="1">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Name <span className="text-danger">*</span></Label>
                      <Controller
                        name="Name"
                        control={control}
                        rules={{ required: "Name is required" }}
                        render={({ field }) => <Input type="text" invalid={!!errors.Name} {...field} />}
                      />
                      {errors.Name && <FormFeedback>{errors.Name.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Surname <span className="text-danger">*</span></Label>
                      <Controller
                        name="Surname"
                        control={control}
                        rules={{ required: "Surname is required" }}
                        render={({ field }) => <Input type="text" invalid={!!errors.Surname} {...field} />}
                      />
                      {errors.Surname && <FormFeedback>{errors.Surname.message}</FormFeedback>}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>ID Number</Label>
                      <Controller
                        name="ID_Number"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Race</Label>
                      <Controller
                        name="Race"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Race</option>
                            {lookupData.race.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Nationality</Label>
                      <Controller
                        name="Nationality"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Nationality</option>
                            {lookupData.nationality.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Nationality Expiry Date</Label>
                      <Controller
                        name="Nationality_Expiry_Date"
                        control={control}
                        render={({ field }) => <Input type="date" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Gender</Label>
                      <Controller
                        name="Gender"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Gender</option>
                            {lookupData.gender.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Born Religion</Label>
                      <Controller
                        name="Born_Religion_ID"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Religion</option>
                            {lookupData.bornReligion.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Period as Muslim</Label>
                      <Controller
                        name="Period_As_Muslim_ID"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Period</option>
                            {lookupData.periodAsMuslim.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Education Level</Label>
                      <Controller
                        name="Highest_Education_Level"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Level</option>
                            {lookupData.educationLevel.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Marital Status</Label>
                      <Controller
                        name="Marital_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.maritalStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Employment Status</Label>
                      <Controller
                        name="Employment_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.employmentStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Health Condition</Label>
                      <Controller
                        name="Health"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Condition</option>
                            {lookupData.healthConditions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Skills</Label>
                      <Controller
                        name="Skills"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Skills</option>
                            {lookupData.skills.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tabId="2">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Cell Number</Label>
                      <Controller
                        name="Cell_Number"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Alternate Number</Label>
                      <Controller
                        name="Alternate_Number"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Email Address</Label>
                      <Controller
                        name="Email_Address"
                        control={control}
                        render={({ field }) => <Input type="email" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Street Address</Label>
                      <Controller
                        name="Street_Address"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Suburb</Label>
                      <Controller
                        name="Suburb"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Suburb</option>
                            {lookupData.suburb.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Dwelling Type</Label>
                      <Controller
                        name="Dwelling_Type"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Type</option>
                            {lookupData.dwellingType.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Dwelling Status</Label>
                      <Controller
                        name="Dwelling_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.dwellingStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Flat Name</Label>
                      <Controller
                        name="Flat_Name"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Flat Number</Label>
                      <Controller
                        name="Flat_Number"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tabId="3">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>File Number</Label>
                      <Controller
                        name="File_Number"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>File Condition</Label>
                      <Controller
                        name="File_Condition"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Condition</option>
                            {lookupData.fileCondition.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>File Status</Label>
                      <Controller
                        name="File_Status"
                        control={control}
                        render={({ field }) => (
                          <Input type="select" {...field}>
                            <option value="">Select Status</option>
                            {lookupData.fileStatus.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Date Intake</Label>
                      <Controller
                        name="Date_Intake"
                        control={control}
                        render={({ field }) => <Input type="date" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={8}>
                    <FormGroup>
                      <Label>POPIA Agreement</Label>
                      <Controller
                        name="POPIA_Agreement"
                        control={control}
                        render={({ field }) => <Input type="text" {...field} />}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              <Button color="danger" onClick={() => setDeleteConfirm(true)} type="button" disabled={isSubmitting}>
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
      <Modal isOpen={deleteConfirm} toggle={() => setDeleteConfirm(false)} centered>
        <ModalHeader toggle={() => setDeleteConfirm(false)}>Confirm Delete</ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete this applicant? <strong>This action cannot be undone.</strong>
          </p>
          <p className="text-muted">
            All related data (comments, tasks, relationships, etc.) will also be affected.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDelete}>
            <i className="bx bx-trash me-1"></i> Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ApplicantSummary;

