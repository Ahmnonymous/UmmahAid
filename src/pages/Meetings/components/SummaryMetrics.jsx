import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ meetings, tasks }) => {
  // Calculate metrics
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(task => 
    task.status && (String(task.status).toLowerCase() === "1" || 
    (task.status_name && task.status_name.toLowerCase() === "complete"))
  ).length;

  const incompleteTasks = totalTasks - completedTasks;

  const metrics = [
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: "bx-task",
      color: "warning",
      bgColor: "#f1b44c",
    },
    {
      title: "Incomplete Tasks",
      value: incompleteTasks,
      icon: "bx-x-circle",
      color: "danger",
      bgColor: "#f46a6a",
    },
  ];

  return (
    <Row className="g-3 mb-4">
      {metrics.map((metric, index) => (
        <Col xl={6} md={6} sm={12} key={index}>
          <Card className="mini-stats-wid mb-0 h-100">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-2">{metric.title}</p>
                  <h4 className="mb-0">{metric.value}</h4>
                </div>
                <div className="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                  <span className="avatar-title rounded-circle" style={{ backgroundColor: metric.bgColor }}>
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

