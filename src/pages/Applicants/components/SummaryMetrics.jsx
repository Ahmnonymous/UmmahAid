import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ financialAssistance, foodAssistance, homeVisits, programs }) => {
  // Calculate totals
  const totalFinancialAssistance = financialAssistance.reduce(
    (sum, item) => sum + (parseFloat(item.financial_amount) || 0),
    0
  );

  const totalFoodAssistance = foodAssistance.reduce(
    (sum, item) => sum + (parseFloat(item.financial_cost) || 0),
    0
  );

  const homeVisitCount = homeVisits.length;
  const programCount = programs.length;

  const metrics = [
    {
      title: "Financial Assistance",
      value: `R ${totalFinancialAssistance.toFixed(2)}`,
      icon: "bx-money",
      color: "primary"
    },
    {
      title: "Food Assistance",
      value: `R ${totalFoodAssistance.toFixed(2)}`,
      icon: "bx-food-menu",
      color: "success"
    },
    {
      title: "Home Visits",
      value: homeVisitCount,
      icon: "bx-home",
      color: "warning"
    },
    {
      title: "Programs",
      value: programCount,
      icon: "bxs-graduation",
      color: "info"
    },
  ];

  return (
    <Row className="mb-3">
      {metrics.map((metric, index) => (
        <Col xl={3} md={6} sm={12} key={index}>
          <Card className="mini-stats-wid">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium">
                    {metric.title}
                  </p>
                  <h4 className="mb-0">{metric.value}</h4>
                </div>
                <div className="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                  <span className={`avatar-title rounded-circle bg-${metric.color}`}>
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

