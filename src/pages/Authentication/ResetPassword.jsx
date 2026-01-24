import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Alert,
  Card,
  CardBody,
  Container,
  FormFeedback,
  Input,
  Label,
  Form,
} from "reactstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";
import axiosApi from "../../helpers/api_helper";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// import images
import profile from "../../assets/images/profile-img.png";
import logo from "../../assets/images/logo.jpeg";
import lightlogo from "../../assets/images/logo.jpeg";

const ResetPasswordPage = (props) => {
  //meta title
  document.title = "Reset Password | UmmahAid - Admin & Dashboard";
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const token = searchParams.get("token");

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.");
        setVerifying(false);
        return;
      }

      try {
        console.log("🔐 [Password Reset] Verifying token...");
        const response = await axiosApi.get(`/auth/verify-reset-token/${token}`);
        console.log("✅ [Password Reset] Token is valid:", response.data);
        setTokenValid(true);
        setError("");
      } catch (err) {
        console.error("❌ [Password Reset] Token verification failed:", err.response?.data || err.message);
        const errorMessage = err.response?.data?.msg || "Invalid or expired reset token. Please request a new password reset.";
        setError(errorMessage);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Please confirm your password"),
    }),
    onSubmit: async (values) => {
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccessMsg("");

        console.log("🔐 [Password Reset] Submitting new password...");
        const response = await axiosApi.post("/auth/reset-password", {
          token: token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        });

        console.log("✅ [Password Reset] Password reset successful:", response.data);
        setSuccessMsg(response.data.msg || "Password has been reset successfully!");
        validation.resetForm();

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        console.error("❌ [Password Reset] Reset failed:", err.response?.data || err.message);
        const errorMessage = err.response?.data?.msg || err.message || "An error occurred. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
  });

  if (verifying) {
    return (
      <React.Fragment>
        <div className="home-btn d-none d-sm-block">
          <Link to="/" className="text-dark">
            <i className="bx bx-home h2" />
          </Link>
        </div>
        <div className="account-pages my-5 pt-sm-5">
          <Container>
            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="overflow-hidden">
                  <CardBody className="pt-0">
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Verifying reset link...</p>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="home-btn d-none d-sm-block">
        <Link to="/" className="text-dark">
          <i className="bx bx-home h2" />
        </Link>
      </div>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <div className="bg-primary-subtlebg-soft-primary">
                  <Row>
                    <Col xs={7}>
                      <div className="text-primary p-4">
                        <h5 className="text-primary">Reset Password</h5>
                        <p>Enter your new password below.</p>
                      </div>
                    </Col>
                    <Col className="col-5 align-self-end">
                      <img src={profile} alt="" className="img-fluid" />
                    </Col>
                  </Row>
                </div>
                <CardBody className="pt-0">
                  <div className="auth-logo">
                    <Link to="/" className="auth-logo-light">
                      <div className="avatar-md profile-user-wid mb-4">
                        <span className="avatar-title rounded-circle bg-light">
                          <img
                            src={lightlogo}
                            alt="UmmahAid"
                            className="rounded-circle"
                            height="34"
                          />
                        </span>
                      </div>
                    </Link>
                    <Link to="/" className="auth-logo-dark">
                      <div className="avatar-md profile-user-wid mb-4">
                        <span className="avatar-title rounded-circle bg-light">
                          <img
                            src={logo}
                            alt="UmmahAid"
                            className="rounded-circle"
                            height="34"
                          />
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="p-2">
                    {error ? (
                      <Alert color="danger" style={{ marginTop: "13px" }}>
                        {error}
                      </Alert>
                    ) : null}
                    {successMsg ? (
                      <Alert color="success" style={{ marginTop: "13px" }}>
                        {successMsg}
                        <br />
                        <small>Redirecting to login page...</small>
                      </Alert>
                    ) : null}

                    {tokenValid && (
                      <Form
                        className="form-horizontal"
                        onSubmit={(e) => {
                          e.preventDefault();
                          validation.handleSubmit();
                          return false;
                        }}
                      >
                        <div className="mb-3">
                          <Label className="form-label">New Password</Label>
                          <Input
                            name="password"
                            className="form-control"
                            placeholder="Enter new password"
                            type="password"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.password || ""}
                            invalid={
                              validation.touched.password &&
                              validation.errors.password
                                ? true
                                : false
                            }
                          />
                          {validation.touched.password &&
                          validation.errors.password ? (
                            <FormFeedback type="invalid">
                              {validation.errors.password}
                            </FormFeedback>
                          ) : null}
                        </div>
                        <div className="mb-3">
                          <Label className="form-label">Confirm Password</Label>
                          <Input
                            name="confirmPassword"
                            className="form-control"
                            placeholder="Confirm new password"
                            type="password"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.confirmPassword || ""}
                            invalid={
                              validation.touched.confirmPassword &&
                              validation.errors.confirmPassword
                                ? true
                                : false
                            }
                          />
                          {validation.touched.confirmPassword &&
                          validation.errors.confirmPassword ? (
                            <FormFeedback type="invalid">
                              {validation.errors.confirmPassword}
                            </FormFeedback>
                          ) : null}
                        </div>
                        <Row className="mb-3">
                          <Col className="text-end">
                            <button
                              className="btn btn-primary w-md"
                              type="submit"
                              disabled={loading}
                            >
                              {loading ? "Resetting..." : "Reset Password"}
                            </button>
                          </Col>
                        </Row>
                      </Form>
                    )}

                    {!tokenValid && !verifying && (
                      <div className="text-center">
                        <Link to="/forgot-password" className="btn btn-primary">
                          Request New Reset Link
                        </Link>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                <p>
                  Go back to{" "}
                  <Link to="/login" className="font-weight-medium text-primary">
                    Login
                  </Link>{" "}
                </p>
                <p>
                  © {new Date().getFullYear()} UmmahAid. Crafted with{" "}
                  <i className="mdi mdi-heart text-danger" /> by Uchakide Solutions
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

ResetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ResetPasswordPage);
