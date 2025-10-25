import React from "react";
import { Row, Col, Card, CardBody, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { getUmmahAidUser } from "../../helpers/userStorage";

import avatar1 from "../../assets/images/users/avatar-1.jpg";
import profileImg from "../../assets/images/profile-img.png";

const WelcomeComp = ({ loading }) => {
  const currentUser = getUmmahAidUser();

  const getUserName = () => {
    if (currentUser) {
      return `${currentUser.name || ""} ${currentUser.surname || ""}`.trim() || currentUser.username || "User";
    }
    return "User";
  };

  const getUserRole = () => {
    return currentUser?.user_type || "Employee";
  };

  // Get current date
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <React.Fragment>
      <Card className="overflow-hidden card-animate">
        <div className="bg-primary bg-soft">
          <Row>
            <Col xs="7">
              <div className="text-primary p-3">
                <h5 className="text-primary fw-semibold mb-1">
                  Welcome back, {getUserName()}!
                </h5>
                <p className="mb-0 font-size-13 opacity-75">
                  {getCurrentDate()}
                </p>
              </div>
            </Col>
            <Col xs="5" className="align-self-end">
              <img src={profileImg} alt="" className="img-fluid" />
            </Col>
          </Row>
        </div>
        <CardBody className="pt-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="text-muted font-size-12 mt-2">Loading profile...</p>
            </div>
          ) : (
            <Row>
              <Col sm="4">
                <div className="avatar-md profile-user-wid mb-4">
                  <img
                    src={avatar1}
                    alt=""
                    className="img-thumbnail rounded-circle"
                  />
                </div>
                <h5 className="font-size-15 text-truncate fw-semibold">{getUserName()}</h5>
                <p className="text-muted mb-0 text-truncate font-size-13">{getUserRole()}</p>
              </Col>

              <Col sm="8">
                <div className="pt-4">
                  <Row>
                    <Col xs="6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar-xs me-2">
                            <span className="avatar-title rounded-circle bg-primary bg-soft text-primary">
                              <i className="bx bx-user font-size-16"></i>
                            </span>
                          </div>
                          <div>
                            <h6 className="mb-0 font-size-14">Applicants</h6>
                            <p className="text-muted mb-0 font-size-11">Manage & Track</p>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xs="6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar-xs me-2">
                            <span className="avatar-title rounded-circle bg-success bg-soft text-success">
                              <i className="bx bx-line-chart font-size-16"></i>
                            </span>
                          </div>
                          <div>
                            <h6 className="mb-0 font-size-14">Analytics</h6>
                            <p className="text-muted mb-0 font-size-11">Real-time Data</p>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  <div className="mt-3">
                    <Link to="/applicants" className="btn btn-primary btn-sm waves-effect waves-light">
                      <i className="bx bx-user-circle me-1"></i>
                      View All Applicants
                    </Link>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    </React.Fragment>
  );
};

export default WelcomeComp;

