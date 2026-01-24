import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Spinner,
  Alert,
} from "reactstrap";
import { Link } from "react-router-dom";

// Import Components
import WelcomeComp from "./WelcomeComp";
import NationalityChart from "./NationalityChart";
import GenderChart from "./GenderChart";
import RaceChart from "./RaceChart";
import EducationChart from "./EducationChart";
import EmploymentChart from "./EmploymentChart";
import MaritalChart from "./MaritalChart";
import SuburbsChart from "./SuburbsChart";
import FileStatusChart from "./FileStatusChart";
import FileConditionChart from "./FileConditionChart";
import StatsCards from "./StatsCards";
import StatisticsApplications from "./StatisticsApplications";
import CandidateSection from "./CandidateSection";
import { JobWidgetCharts } from "../DashboardJob/JobCharts";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

// i18n
import { withTranslation } from "react-i18next";

// API
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";

const ApplicantStatistics = (props) => {
  // Meta title
  document.title = "Dashboard | UmmahAid";

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    nationality: [],
    gender: [],
    race: [],
    education: [],
    employment: [],
    marital: [],
    suburbs: [],
    fileStatus: [],
    fileCondition: [],
    totalApplicants: 0,
    activeApplicants: 0,
    newThisMonth: 0,
    totalFoodAid: 0,
    totalHomeVisits: 0,
    totalPrograms: 0,
    applicantsTrend: [0, 0, 0, 0, 0, 0, 0, 0],
    foodAidTrend: [0, 0, 0, 0, 0, 0, 0, 0],
    homeVisitsTrend: [0, 0, 0, 0, 0, 0, 0, 0],
    programsTrend: [0, 0, 0, 0, 0, 0, 0, 0],
    applicantsTrendChange: null,
    foodAidTrendChange: null,
    homeVisitsTrendChange: null,
    programsTrendChange: null,
  });

  useEffect(() => {
    fetchStatisticsData();
  }, []);

  const fetchStatisticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from backend endpoint
      const response = await axiosApi.get(`${API_BASE_URL}/dashboard/applicant-statistics`);
      const data = response.data;

      // Transform data to ensure consistency
      setStatsData({
        nationality: Array.isArray(data.nationality) ? data.nationality : [],
        gender: Array.isArray(data.gender) ? data.gender : [],
        race: Array.isArray(data.race) ? data.race : [],
        education: Array.isArray(data.education) ? data.education : [],
        employment: Array.isArray(data.employment) ? data.employment : [],
        marital: Array.isArray(data.marital) ? data.marital : [],
        suburbs: Array.isArray(data.suburbs) ? data.suburbs : [],
        fileStatus: Array.isArray(data.fileStatus) ? data.fileStatus : [],
        fileCondition: Array.isArray(data.fileCondition) ? data.fileCondition : [],
        totalApplicants: parseInt(data.summary?.total_applicants) || 0,
        activeApplicants: parseInt(data.summary?.active_applicants) || 0,
        newThisMonth: parseInt(data.summary?.new_this_month) || 0,
        totalFoodAid: parseInt(data.summary?.total_food_aid) || 0,
        totalHomeVisits: parseInt(data.summary?.total_home_visits) || 0,
        totalPrograms: parseInt(data.summary?.total_programs) || 0,
        applicantsTrend: Array.isArray(data.trends?.applicants)
          ? data.trends.applicants.map((val) => Number(val) || 0)
          : [0, 0, 0, 0, 0, 0, 0, 0],
        foodAidTrend: Array.isArray(data.trends?.foodAid)
          ? data.trends.foodAid.map((val) => Number(val) || 0)
          : [0, 0, 0, 0, 0, 0, 0, 0],
        homeVisitsTrend: Array.isArray(data.trends?.homeVisits)
          ? data.trends.homeVisits.map((val) => Number(val) || 0)
          : [0, 0, 0, 0, 0, 0, 0, 0],
        programsTrend: Array.isArray(data.trends?.programs)
          ? data.trends.programs.map((val) => Number(val) || 0)
          : [0, 0, 0, 0, 0, 0, 0, 0],
        applicantsTrendChange:
          typeof data.trends?.applicantsChange === "number"
            ? data.trends.applicantsChange
            : null,
        foodAidTrendChange:
          typeof data.trends?.foodAidChange === "number"
            ? data.trends.foodAidChange
            : null,
        homeVisitsTrendChange:
          typeof data.trends?.homeVisitsChange === "number"
            ? data.trends.homeVisitsChange
            : null,
        programsTrendChange:
          typeof data.trends?.programsChange === "number"
            ? data.trends.programsChange
            : null,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError(error.response?.data?.error || error.message || "Failed to load statistics");
      
      // Use mock data as fallback
      setStatsData(getMockData());
    } finally {
      setLoading(false);
    }
  };


  const getMockData = () => {
    return {
      nationality: [
        { label: "South African", value: 450 },
        { label: "Zimbabwean", value: 120 },
        { label: "Nigerian", value: 80 },
        { label: "Somali", value: 65 },
        { label: "Other", value: 85 },
      ],
      gender: [
        { label: "Male", value: 420 },
        { label: "Female", value: 380 },
      ],
      race: [
        { label: "Black African", value: 520 },
        { label: "Coloured", value: 150 },
        { label: "Indian", value: 80 },
        { label: "White", value: 50 },
      ],
      education: [
        { label: "Matric", value: 320 },
        { label: "Tertiary", value: 180 },
        { label: "Primary", value: 150 },
        { label: "No Formal", value: 100 },
        { label: "Post-Graduate", value: 50 },
      ],
      employment: [
        { label: "Unemployed", value: 480 },
        { label: "Employed", value: 200 },
        { label: "Self-Employed", value: 80 },
        { label: "Student", value: 40 },
      ],
      marital: [
        { label: "Single", value: 350 },
        { label: "Married", value: 280 },
        { label: "Divorced", value: 100 },
        { label: "Widowed", value: 70 },
      ],
      suburbs: [
        { label: "Mitchells Plain", value: 180 },
        { label: "Khayelitsha", value: 160 },
        { label: "Athlone", value: 120 },
        { label: "Manenberg", value: 100 },
        { label: "Bonteheuwel", value: 90 },
        { label: "Hanover Park", value: 70 },
        { label: "Delft", value: 65 },
        { label: "Philippi", value: 55 },
        { label: "Gugulethu", value: 50 },
        { label: "Nyanga", value: 45 },
      ],
      fileStatus: [
        { label: "Active", value: 520 },
        { label: "Inactive", value: 180 },
        { label: "Pending", value: 100 },
      ],
      fileCondition: [
        { label: "Good", value: 420 },
        { label: "Fair", value: 250 },
        { label: "Poor", value: 130 },
      ],
      totalApplicants: 800,
      activeApplicants: 520,
      newThisMonth: 45,
      totalFoodAid: 320,
      totalHomeVisits: 210,
      totalPrograms: 95,
      applicantsTrend: [680, 700, 720, 740, 760, 780, 795, 810],
      foodAidTrend: [260, 270, 280, 290, 300, 305, 315, 320],
      homeVisitsTrend: [160, 170, 180, 190, 195, 200, 205, 210],
      programsTrend: [60, 65, 70, 75, 80, 85, 90, 95],
      applicantsTrendChange: 2.01,
      foodAidTrendChange: 1.59,
      homeVisitsTrendChange: 2.44,
      programsTrendChange: 6.4,
    };
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Render Breadcrumb */}
          <Breadcrumbs
            title={props.t("Dashboard")}
            breadcrumbItem={props.t("Dashboard")}
          />

          {/* Error Alert */}
          {error && (
            <Alert color="danger" className="alert-dismissible fade show" role="alert">
              <i className="mdi mdi-alert-outline me-2"></i>
              <strong>Error:</strong> {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
                aria-label="Close"
              ></button>
            </Alert>
          )}

          {/* Welcome Section & Stats Cards */}
          <Row>
            <Col>
              <WelcomeComp loading={loading} />
            </Col>
            {/* <Col xl="8">
              <StatsCards data={statsData} loading={loading} />
            </Col> */}
          </Row>

          {/* Summary KPI Cards */}
          <Row className="mb-4">
            {[
              {
                title: "Total Applicants",
                value: statsData.totalApplicants,
                dataColors: '["--bs-primary", "--bs-transparent"]',
                seriesName: "Total Applicants",
                series: statsData.applicantsTrend,
                change: statsData.applicantsTrendChange,
              },
              {
                title: "Total Food Aid",
                value: statsData.totalFoodAid,
                dataColors: '["--bs-success", "--bs-transparent"]',
                seriesName: "Total Food Aid",
                series: statsData.foodAidTrend,
                change: statsData.foodAidTrendChange,
              },
              {
                title: "Total Home Visits",
                value: statsData.totalHomeVisits,
                dataColors: '["--bs-info", "--bs-transparent"]',
                seriesName: "Total Home Visits",
                series: statsData.homeVisitsTrend,
                change: statsData.homeVisitsTrendChange,
              },
              {
                title: "Total Programs",
                value: statsData.totalPrograms,
                dataColors: '["--bs-warning", "--bs-transparent"]',
                seriesName: "Total Programs",
                series: statsData.programsTrend,
                change: statsData.programsTrendChange,
              },
            ].map((widget, index) => {
              const seriesData =
                Array.isArray(widget.series) && widget.series.length
                  ? widget.series
                  : [0, 0, 0, 0, 0, 0, 0, 0];
              const changeValue =
                typeof widget.change === "number" ? widget.change : null;

              return (
                <Col xl="3" lg="6" className="mb-3" key={widget.title + index}>
                  <Card className="mini-stats-wid card-animate h-100">
                    <CardBody className="d-flex flex-column">
                      <div className="d-flex flex-grow-1">
                        <div className="flex-grow-1">
                          <p className="text-muted fw-medium">
                            {widget.title}
                          </p>
                          <h4 className="mb-0">
                            {(widget.value ?? 0).toLocaleString()}
                          </h4>
                        </div>
                        <div className="flex-shrink-0 align-self-center">
                          <JobWidgetCharts
                            dataColors={widget.dataColors}
                            series={[
                              {
                                name: widget.seriesName,
                                data: seriesData,
                              },
                            ]}
                          />
                        </div>
                      </div>
                      {changeValue !== null && (
                        <div className="border-top pt-3 mt-3">
                          <p className="mb-0">
                            <span
                              className={`badge badge-soft-${
                                changeValue >= 0 ? "success" : "danger"
                              } me-2`}
                            >
                              <i
                                className={`bx bx-trending-${
                                  changeValue >= 0 ? "up" : "down"
                                } align-bottom me-1`}
                              ></i>
                              {Math.abs(changeValue).toFixed(2)}%
                            </span>
                            {changeValue >= 0 ? "Increase" : "Decrease"}{" "}
                             last month
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Statistics Applications & Invite Friends */}
          <Row>
            <StatisticsApplications />
            <CandidateSection />
          </Row>


          {/* Charts Grid - Row 1 */}
          <Row className="mb-4">
            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Nationality</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <NationalityChart data={statsData.nationality} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Gender</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="success" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <GenderChart data={statsData.gender} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid - Row 2 */}
          <Row className="mb-4">
            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Highest Education</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="warning" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <EducationChart data={statsData.education} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Race</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="info" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <RaceChart data={statsData.race} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid - Row 3 */}
          <Row className="mb-4">
            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Suburbs</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="success" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <SuburbsChart data={statsData.suburbs} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Employment Status</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="danger" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <EmploymentChart data={statsData.employment} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid - Row 4 */}
          <Row className="mb-4">
            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">Marital Status</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <MaritalChart data={statsData.marital} />
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">File Status</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="info" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <FileStatusChart data={statsData.fileStatus} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid - Row 5 */}
          <Row className="mb-4">
            <Col xl="6" lg="6" className="d-flex">
              <Card className="flex-fill" style={{ minHeight: "280px" }}>
                <CardBody>
                  <h4 className="card-title mb-4">File Condition</h4>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="warning" />
                      <p className="text-muted font-size-12 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <FileConditionChart data={statsData.fileCondition} />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

ApplicantStatistics.propTypes = {
  t: PropTypes.any,
};

export default withTranslation()(ApplicantStatistics);

