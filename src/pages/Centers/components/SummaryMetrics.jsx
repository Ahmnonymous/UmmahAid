import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const DEFAULT_METRICS = {
  totalApplicants: 0,
  totalRelationships: 0,
  totalFinancialAssistance: 0,
  totalFoodAssistance: 0,
};

const formatNumber = (value) => {
  const numericValue =
    typeof value === "number" ? value : parseFloat(value ?? "0");
  if (Number.isNaN(numericValue)) {
    return "0";
  }
  return new Intl.NumberFormat("en-ZA").format(numericValue);
};

const formatCurrency = (value) => {
  const numericValue =
    typeof value === "number" ? value : parseFloat(value ?? "0");
  if (Number.isNaN(numericValue)) {
    return "R 0.00";
  }
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(numericValue);
};

const SummaryMetrics = ({ metrics, loading }) => {
  const data = metrics || DEFAULT_METRICS;

  const items = [
    {
      title: "Applicants",
      value: data.totalApplicants,
      isCurrency: false,
      icon: "bx-user-check",
      bgColor: "#556ee6",
    },
    {
      title: "Relationships",
      value: data.totalRelationships,
      isCurrency: false,
      icon: "bx-group",
      bgColor: "#34c38f",
    },
    {
      title: "Financial Assistance",
      value: data.totalFinancialAssistance,
      isCurrency: true,
      icon: "bx-credit-card",
      bgColor: "#50a5f1",
    },
    {
      title: "Food Assistance",
      value: data.totalFoodAssistance,
      isCurrency: true,
      icon: "bx-food-menu",
      bgColor: "#f1b44c",
    },
  ];

  return (
    <Row>
      {items.map((metric, index) => (
        <Col xl={3} md={6} sm={12} key={index}>
          <Card className="mini-stats-wid mb-3">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-2">{metric.title}</p>
                  <h4 className="mb-0">
                    {loading
                      ? "Loading..."
                      : metric.isCurrency
                        ? formatCurrency(metric.value)
                        : formatNumber(metric.value)}
                  </h4>
                </div>
                <div className="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                  <span
                    className="avatar-title rounded-circle"
                    style={{ backgroundColor: metric.bgColor }}
                  >
                    <i className={`bx ${metric.icon} font-size-24`}></i>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default SummaryMetrics;

