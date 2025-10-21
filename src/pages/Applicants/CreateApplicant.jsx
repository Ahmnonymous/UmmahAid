import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  Alert,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getUmmahAidUser } from "../../helpers/userStorage";

const CreateApplicant = () => {
  document.title = "Create Applicant | UmmahAid";

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [alert, setAlert] = useState(null);
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
  });

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

  useEffect(() => {
    fetchLookupData();
  }, []);

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
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      showAlert("Failed to fetch lookup data", "warning");
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
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
        
        // Only append lookup fields if they have values (to avoid empty string -> BIGINT errors)
        if (data.Nationality) formData.append("nationality", data.Nationality);
        if (data.Gender) formData.append("gender", data.Gender);
        if (data.Race) formData.append("race", data.Race);
        if (data.Employment_Status) formData.append("employment_status", data.Employment_Status);
        if (data.Skills) formData.append("skills", data.Skills);
        if (data.Highest_Education) formData.append("highest_education_level", data.Highest_Education);
        
        formData.append("cell_number", data.Cell_Number || "");
        formData.append("alternate_number", data.Alternate_Number || "");
        formData.append("email_address", data.Email_Address || "");
        formData.append("street_address", data.Street_Address || "");
        
        if (data.Suburb) formData.append("suburb", data.Suburb);
        if (data.Dwelling_Type) formData.append("dwelling_type", data.Dwelling_Type);
        if (data.Dwelling_Status) formData.append("dwelling_status", data.Dwelling_Status);
        if (data.Health_Conditions) formData.append("health", data.Health_Conditions);
        if (data.Marital_Status) formData.append("marital_status", data.Marital_Status);
        
        formData.append("date_intake", data.Date_Intake || new Date().toISOString().split("T")[0]);
        formData.append("file_number", data.File_Number || "");
        
        if (data.File_Condition) formData.append("file_condition", data.File_Condition);
        if (data.File_Status) formData.append("file_status", data.File_Status);
        
        formData.append("signature", data.Signature[0]);
        formData.append("popia_agreement", data.Popia ? "Y" : "N");
        formData.append("center_id", currentUser?.center_id || 1);
        formData.append("created_by", currentUser?.username || "system");

        await axiosApi.post(`${API_BASE_URL}/applicantDetails`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const payload = {
          name: data.Name,
          surname: data.Surname,
          id_number: data.ID_Number,
          nationality: data.Nationality && data.Nationality !== "" ? parseInt(data.Nationality) : null,
          gender: data.Gender && data.Gender !== "" ? parseInt(data.Gender) : null,
          race: data.Race && data.Race !== "" ? parseInt(data.Race) : null,
          employment_status: data.Employment_Status && data.Employment_Status !== "" ? parseInt(data.Employment_Status) : null,
          skills: data.Skills && data.Skills !== "" ? parseInt(data.Skills) : null,
          highest_education_level: data.Highest_Education && data.Highest_Education !== "" ? parseInt(data.Highest_Education) : null,
          cell_number: data.Cell_Number || null,
          alternate_number: data.Alternate_Number || null,
          email_address: data.Email_Address || null,
          street_address: data.Street_Address || null,
          suburb: data.Suburb && data.Suburb !== "" ? parseInt(data.Suburb) : null,
          dwelling_type: data.Dwelling_Type && data.Dwelling_Type !== "" ? parseInt(data.Dwelling_Type) : null,
          dwelling_status: data.Dwelling_Status && data.Dwelling_Status !== "" ? parseInt(data.Dwelling_Status) : null,
          health: data.Health_Conditions && data.Health_Conditions !== "" ? parseInt(data.Health_Conditions) : null,
          marital_status: data.Marital_Status && data.Marital_Status !== "" ? parseInt(data.Marital_Status) : null,
          date_intake: data.Date_Intake || new Date().toISOString().split("T")[0],
          file_number: data.File_Number,
          file_condition: data.File_Condition && data.File_Condition !== "" ? parseInt(data.File_Condition) : null,
          file_status: data.File_Status && data.File_Status !== "" ? parseInt(data.File_Status) : null,
          popia_agreement: data.Popia ? "Y" : "N",
          center_id: currentUser?.center_id || 1,
          created_by: currentUser?.username || "system",
        };

        await axiosApi.post(`${API_BASE_URL}/applicantDetails`, payload);
      }
      
      showAlert("Applicant has been created successfully", "success");
      setTimeout(() => {
        navigate("/applicants");
      }, 1500);
    } catch (error) {
      console.error("Error creating applicant:", error);
      showAlert(error?.response?.data?.message || "Failed to create applicant", "danger");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        {/* Alert Notification */}
        {alert && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
            <Alert color={alert.color} isOpen={!!alert} toggle={() => setAlert(null)}>
              {alert.message}
            </Alert>
          </div>
        )}

        <Breadcrumbs title="Applicants" breadcrumbItem="Create New Applicant" />

        <Row>
          <Col xl={12}>
            <Card className="border shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0 fw-semibold font-size-16">
                    <i className="bx bx-user-plus me-2 text-primary"></i>
                    Create New Applicant
                  </h5>
                  {/* <Button
                    color="light"
                    size="sm"
                    onClick={() => navigate("/applicants")}
                  >
                    <i className="bx bx-arrow-back me-1"></i> Back to List
                  </Button> */}
                </div>
              </div>

              <CardBody className="p-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  {/* Tabs */}
                  <Nav tabs className="nav-tabs-custom">
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => toggleTab("1")}
                        style={{ cursor: "pointer" }}
                      >
                        <i className="bx bx-user me-1"></i>
                        Personal Info
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "2" })}
                        onClick={() => toggleTab("2")}
                        style={{ cursor: "pointer" }}
                      >
                        <i className="bx bx-map me-1"></i>
                        Contact & Address
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "3" })}
                        onClick={() => toggleTab("3")}
                        style={{ cursor: "pointer" }}
                      >
                        <i className="bx bx-folder me-1"></i>
                        File Details
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <TabContent activeTab={activeTab} className="p-4 border border-top-0">
                    {/* Tab 1: Personal Info */}
                    <TabPane tabId="1">
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
                      </Row>
                    </TabPane>

                    {/* Tab 2: Contact & Address */}
                    <TabPane tabId="2">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="Cell_Number">Cell Number</Label>
                            <Controller
                              name="Cell_Number"
                              control={control}
                              render={({ field }) => (
                                <Input id="Cell_Number" type="text" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Alternate_Number">Alternate Number</Label>
                            <Controller
                              name="Alternate_Number"
                              control={control}
                              render={({ field }) => (
                                <Input id="Alternate_Number" type="text" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={12}>
                          <FormGroup>
                            <Label for="Email_Address">Email Address</Label>
                            <Controller
                              name="Email_Address"
                              control={control}
                              render={({ field }) => (
                                <Input id="Email_Address" type="email" {...field} />
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
                              render={({ field }) => <Input id="Street_Address" type="text" {...field} />}
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
                      </Row>
                    </TabPane>

                    {/* Tab 3: File Details */}
                    <TabPane tabId="3">
                      <Row>
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
                              <span className="ms-2">I agree to the POPIA terms and conditions</span>
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>
                    </TabPane>
                  </TabContent>

                  {/* Form Actions */}
                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <Button
                      type="button"
                      color="light"
                      onClick={() => navigate("/applicants")}
                      disabled={isSubmitting}
                    >
                      <i className="bx bx-x me-1"></i> Cancel
                    </Button>
                    <Button color="success" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-save me-1"></i> Create Applicant
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateApplicant;

