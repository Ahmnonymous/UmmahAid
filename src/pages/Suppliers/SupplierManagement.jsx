import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import SupplierListPanel from "./components/SupplierListPanel";
import SupplierSummary from "./components/SupplierSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";

const SupplierManagement = () => {
  // Meta title
  document.title = "Supplier Management | Welfare App";

  // State management
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);

  // Detail data states
  const [evaluations, setEvaluations] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Lookup data states
  const [lookupData, setLookupData] = useState({
    supplierCategories: [],
  });

  // Fetch all suppliers on mount
  useEffect(() => {
    fetchSuppliers();
    fetchLookupData();
  }, []);

  // Fetch detail data when a supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/supplierProfile`);
      setSuppliers(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedSupplier(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      showAlert("Failed to fetch suppliers", "danger");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchSupplierDetails = async (supplierId) => {
    try {
      const [evaluationsRes, documentsRes] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/supplierEvaluation?supplier_id=${supplierId}`),
        axiosApi.get(`${API_BASE_URL}/supplierDocument?supplier_id=${supplierId}`),
      ]);

      setEvaluations(evaluationsRes.data || []);
      setDocuments(documentsRes.data || []);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      showAlert("Failed to fetch supplier details", "warning");
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

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    // Clear existing detail data to avoid showing stale records while fetching
    setEvaluations([]);
    setDocuments([]);
    // Fetch fresh detail data immediately for better UX
    if (supplier?.id) {
      fetchSupplierDetails(supplier.id);
    }
  };

  const handleSupplierUpdate = useCallback(() => {
    fetchSuppliers();
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const handleDetailUpdate = useCallback(() => {
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (supplier.name || "").toLowerCase().includes(searchLower) ||
      (supplier.registration_no || "").toLowerCase().includes(searchLower) ||
      (supplier.contact_person || "").toLowerCase().includes(searchLower) ||
      (supplier.contact_email || "").toLowerCase().includes(searchLower)
    );
  });

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

        <Breadcrumbs title="Suppliers" breadcrumbItem="Supplier Management" />

        <Row>
          {/* Left Panel - Supplier List */}
          <Col lg={3}>
            <SupplierListPanel
              suppliers={filteredSuppliers}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={handleSupplierSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading}
              onRefresh={fetchSuppliers}
            />
          </Col>

          {/* Main Panel - Supplier Details */}
          <Col lg={9}>
            {selectedSupplier ? (
              <>
                {/* Summary Metrics */}
                <SummaryMetrics
                  evaluations={evaluations}
                  documents={documents}
                />

                {/* Supplier Summary */}
                <SupplierSummary
                  supplier={selectedSupplier}
                  lookupData={lookupData}
                  onUpdate={handleSupplierUpdate}
                  showAlert={showAlert}
                />

                {/* Detail Tabs */}
                <DetailTabs
                  key={selectedSupplier.id}
                  supplierId={selectedSupplier.id}
                  evaluations={evaluations}
                  documents={documents}
                  lookupData={lookupData}
                  onUpdate={handleDetailUpdate}
                  showAlert={showAlert}
                />
              </>
            ) : (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-store display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading ? "Loading suppliers..." : "Select a supplier to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SupplierManagement;
