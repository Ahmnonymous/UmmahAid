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

const CreateSupplier = () => {
  document.title = "Create Supplier | UmmahAid";

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [alert, setAlert] = useState(null);
  const [lookupData, setLookupData] = useState({
    supplierCategories: [],
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      Name: "",
      Registration_No: "",
      Contact_Person: "",
      Contact_Email: "",
      Contact_Phone: "",
      Address: "",
      Category_ID: "",
      Status: "Active",
    },
  });

  useEffect(() => {
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [supplierCategoriesRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/lookup/Supplier_Category`),
      ]);

      setLookupData({
        supplierCategories: supplierCategoriesRes.data || [],
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

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getUmmahAidUser();
      
      const payload = {
        name: data.Name,
        registration_no: data.Registration_No,
        contact_person: data.Contact_Person,
        contact_email: data.Contact_Email,
        contact_phone: data.Contact_Phone,
        address: data.Address,
        category_id: data.Category_ID && data.Category_ID !== "" ? data.Category_ID : null,
        status: data.Status,
        center_id: currentUser?.center_id || 1,
        created_by: currentUser?.username || "system",
      };

      await axiosApi.post(`${API_BASE_URL}/supplierProfile`, payload);
      
      showAlert("Supplier has been created successfully", "success");
      setTimeout(() => {
        navigate("/suppliers");
      }, 1500);
    } catch (error) {
      console.error("Error creating supplier:", error);
      showAlert(error?.response?.data?.error || "Failed to create supplier", "danger");
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

        <Breadcrumbs title="Suppliers" breadcrumbItem="Create New Supplier" />

        <Row>
          <Col xl={12}>
            <Card className="border shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0 fw-semibold font-size-16">
                    <i className="bx bx-store me-2 text-primary"></i>
                    Create New Supplier
                  </h5>
                  <Button
                    color="light"
                    size="sm"
                    onClick={() => navigate("/suppliers")}
                  >
                    <i className="bx bx-arrow-back me-1"></i> Back to Suppliers List
                  </Button>                  
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
                        <i className="bx bx-store me-1"></i>
                        General Information
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "2" })}
                        onClick={() => toggleTab("2")}
                        style={{ cursor: "pointer" }}
                      >
                        <i className="bx bx-map me-1"></i>
                        Contact Details
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <TabContent activeTab={activeTab} className="p-4 border border-top-0">
                    {/* Tab 1: General Information */}
                    <TabPane tabId="1">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="Name">
                              Supplier Name <span className="text-danger">*</span>
                            </Label>
                            <Controller
                              name="Name"
                              control={control}
                              rules={{ required: "Supplier name is required" }}
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
                            <Label for="Registration_No">Registration Number</Label>
                            <Controller
                              name="Registration_No"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id="Registration_No"
                                  type="text"
                                  {...field}
                                />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Category_ID">Category</Label>
                            <Controller
                              name="Category_ID"
                              control={control}
                              render={({ field }) => (
                                <Input id="Category_ID" type="select" {...field}>
                                  <option value="">Select Category</option>
                                  {(lookupData.supplierCategories || []).map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Status">Status</Label>
                            <Controller
                              name="Status"
                              control={control}
                              render={({ field }) => (
                                <Input id="Status" type="select" {...field}>
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                  <option value="Pending">Pending</option>
                                </Input>
                              )}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </TabPane>

                    {/* Tab 2: Contact Details */}
                    <TabPane tabId="2">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="Contact_Person">Contact Person</Label>
                            <Controller
                              name="Contact_Person"
                              control={control}
                              render={({ field }) => (
                                <Input id="Contact_Person" type="text" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Contact_Email">Contact Email</Label>
                            <Controller
                              name="Contact_Email"
                              control={control}
                              render={({ field }) => (
                                <Input id="Contact_Email" type="email" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="Contact_Phone">Contact Phone</Label>
                            <Controller
                              name="Contact_Phone"
                              control={control}
                              render={({ field }) => (
                                <Input id="Contact_Phone" type="text" {...field} />
                              )}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={12}>
                          <FormGroup>
                            <Label for="Address">Address</Label>
                            <Controller
                              name="Address"
                              control={control}
                              render={({ field }) => (
                                <Input id="Address" type="textarea" rows="3" {...field} />
                              )}
                            />
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
                      onClick={() => navigate("/suppliers")}
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
                          <i className="bx bx-save me-1"></i> Create Supplier
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

export default CreateSupplier;
