import React, { useEffect } from "react";
import { Row, Col } from "reactstrap";

// Import images
import financialAssistanceImage from "../../../assets/images/icon_images/Financial Assistance/bank-safe-illustration-2025-10-20-04-32-44-utc.png";
import foodAssistanceImage from "../../../assets/images/icon_images/Food Assistance/salad-ingredients-illustration-2025-10-20-06-29-39-utc.png";
import homeVisitImage from "../../../assets/images/icon_images/Home Visit/duotone-illustration-of-a-private-house-2025-10-20-03-17-15-utc.png";
import higherEducationImage from "../../../assets/images/icon_images/Higher Education/hand-holding-books-with-graduation-cap-and-diploma-2025-10-20-04-29-14-utc.png";

const SummaryMetrics = ({ applicantId, financialAssistance, foodAssistance, homeVisits, programs }) => {
  // Add dark mode styles
  useEffect(() => {
    const styleId = 'summary-metrics-dark-mode-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        [data-bs-theme="dark"] .metric-card-wrapper,
        .dark .metric-card-wrapper,
        body.dark .metric-card-wrapper {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: var(--bs-body-bg, #1a1a1a) !important;
        }
        [data-bs-theme="dark"] .metric-card-inner,
        .dark .metric-card-inner,
        body.dark .metric-card-inner {
          background: var(--bs-body-bg, #1a1a1a) !important;
          color: var(--bs-body-color, #e9ecef) !important;
        }
        [data-bs-theme="dark"] .metric-card-value,
        .dark .metric-card-value,
        body.dark .metric-card-value {
          color: var(--bs-body-color, #e9ecef) !important;
        }
        [data-bs-theme="dark"] .metric-card-wrapper:hover,
        .dark .metric-card-wrapper:hover,
        body.dark .metric-card-wrapper:hover {
          box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  // Ensure metrics reflect ONLY the selected applicant
  const faForApplicant = (financialAssistance || []).filter((x) => String(x.file_id) === String(applicantId));
  const foodForApplicant = (foodAssistance || []).filter((x) => String(x.file_id) === String(applicantId));
  const visitsForApplicant = (homeVisits || []).filter((x) => String(x.file_id) === String(applicantId));
  const programsForApplicant = (programs || []).filter((x) => String(x.person_trained_id) === String(applicantId));

  // Calculate totals
  const totalFinancialAssistance = faForApplicant.reduce(
    (sum, item) => sum + (parseFloat(item.financial_amount) || 0),
    0
  );

  const totalFoodAssistance = foodForApplicant.reduce(
    (sum, item) => sum + (parseFloat(item.financial_cost) || 0),
    0
  );

  const homeVisitCount = visitsForApplicant.length;
  const programCount = programsForApplicant.length;

  const metrics = [
    {
      title: "Financial Assistance",
      value: `R ${totalFinancialAssistance.toFixed(2)}`,
      image: financialAssistanceImage,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "Food Assistance",
      value: `R ${totalFoodAssistance.toFixed(2)}`,
      image: foodAssistanceImage,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      title: "Home Visit",
      value: homeVisitCount,
      image: homeVisitImage,
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
      title: "Programs",
      value: programCount,
      image: higherEducationImage,
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
  ];

  return (
    <Row className="mb-4">
      {metrics.map((metric, index) => (
        <Col key={index} xs="12" md="6" lg="6" className="mb-3">
          <div
            className="w-100 metric-card-wrapper"
            style={{
              background: 'var(--bs-body-bg, transparent)',
              border: '1px solid var(--bs-border-color, rgb(96, 119, 231))',
              borderRadius: "12px",
              padding: "3px",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
                           document.body.classList.contains('dark') ||
                           window.getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark';
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = isDark 
                ? "0 10px 20px rgba(255,255,255,0.1)" 
                : "0 10px 20px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              className="w-100 d-flex align-items-center justify-content-between metric-card-inner"
              style={{
                background: "var(--bs-body-bg, transparent)",
                backgroundColor: "var(--bs-body-bg, transparent)",
                backgroundImage: "none",
                color: "var(--bs-body-color, #495057)",
                minHeight: "90px",
                borderRadius: "9px",
                padding: "0.75rem 1rem",
              }}
            >
              <div className="flex-grow-1">
                <p 
                  className="text-start fw-bold mb-1 metric-card-title" 
                  style={{ 
                    fontSize: "0.875rem", 
                    fontWeight: "700",
                    background: metric.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: "0.375rem"
                  }}
                >
                  {metric.title}
                </p>
                <h4 
                  className="mb-0 metric-card-value" 
                  style={{ 
                    fontSize: "1.25rem", 
                    fontWeight: "700", 
                    color: "var(--bs-body-color, #2d2d2d)"
                  }}
                >
                  {metric.value}
                </h4>
              </div>
              <div
                className="flex-shrink-0 ms-3"
                style={{ 
                  width: "70px", 
                  height: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <img 
                  src={metric.image} 
                  alt={metric.title}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "contain",
                    maxWidth: "70px",
                    maxHeight: "70px"
                  }}
                />
              </div>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default SummaryMetrics;

