import React, { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Table, Spinner, Alert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GET_TOTAL_FINANCIAL_ASSISTANCE_REPORT } from '../../helpers/url_helper';

const TotalFinancialAssistanceReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await axios.get(GET_TOTAL_FINANCIAL_ASSISTANCE_REPORT, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch data');
            }
        } catch (err) {
            console.error('Error fetching total financial assistance:', err);
            setError(err.response?.data?.message || 'Error fetching total financial assistance');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        if (!amount) return 'R 0.00';
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    };

    const totalFoodAssistance = data.reduce((sum, item) => sum + (parseFloat(item.financial_food_assistance) || 0), 0);
    const totalFinancialTransactions = data.reduce((sum, item) => sum + (parseFloat(item.financial_transactions) || 0), 0);
    const grandTotal = totalFoodAssistance + totalFinancialTransactions;

    if (loading) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <Spinner color="primary" className="me-2" />
                        <span>Loading total financial assistance report...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <Alert color="danger">
                        <h5>Error Loading Report</h5>
                        <p>{error}</p>
                        <Button color="primary" onClick={fetchData}>Retry</Button>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Header */}
                <Row>
                    <Col lg={12}>
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">
                                <i className="bx bx-money me-2"></i>
                                Total Financial Assistance Report
                            </h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link to="/dashboard">Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link to="/reports">Reports</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Total Financial Assistance</li>
                                </ol>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Summary Cards */}
                <Row>
                    <Col lg={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Total Recipients</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-primary fs-14 mb-0">{data.length}</h5>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Food Assistance</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-success fs-14 mb-0">{formatCurrency(totalFoodAssistance)}</h5>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Financial Transactions</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-info fs-14 mb-0">{formatCurrency(totalFinancialTransactions)}</h5>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Grand Total</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-warning fs-14 mb-0">{formatCurrency(grandTotal)}</h5>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Search and Actions */}
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <Row className="g-3">
                                    <Col lg={6}>
                                        <div className="search-box">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search by name or file number..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <i className="ri-search-line search-icon"></i>
                                        </div>
                                    </Col>
                                    <Col lg={6} className="text-end">
                                        <Button color="primary" className="me-2">
                                            <i className="bx bx-export me-1"></i>
                                            Export Excel
                                        </Button>
                                        <Button color="success">
                                            <i className="bx bx-printer me-1"></i>
                                            Print
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Data Table */}
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <div className="table-responsive">
                                    <Table className="table table-striped table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>File Number</th>
                                                <th>Contact</th>
                                                <th>Employment Status</th>
                                                <th>File Status</th>
                                                <th>Food Assistance</th>
                                                <th>Financial Transactions</th>
                                                <th>Total Assistance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <strong>{item.name} {item.surname}</strong>
                                                    </td>
                                                    <td>{item.file_number || '-'}</td>
                                                    <td>{item.cell_number || '-'}</td>
                                                    <td>
                                                        <span className={`badge bg-${item.employment_status_name === 'Unemployed' ? 'danger' : 
                                                            item.employment_status_name?.includes('Employed') ? 'success' : 'secondary'}`}>
                                                            {item.employment_status_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${item.file_status_name === 'Active' ? 'success' : 'secondary'}`}>
                                                            {item.file_status_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <strong className="text-success">
                                                            {formatCurrency(item.financial_food_assistance)}
                                                        </strong>
                                                    </td>
                                                    <td className="text-end">
                                                        <strong className="text-info">
                                                            {formatCurrency(item.financial_transactions)}
                                                        </strong>
                                                    </td>
                                                    <td className="text-end">
                                                        <strong className="text-warning">
                                                            {formatCurrency(item.total_financial)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="table-active">
                                                <th colSpan="5" className="text-end">Grand Totals:</th>
                                                <th className="text-end text-success">{formatCurrency(totalFoodAssistance)}</th>
                                                <th className="text-end text-info">{formatCurrency(totalFinancialTransactions)}</th>
                                                <th className="text-end text-warning">{formatCurrency(grandTotal)}</th>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                                
                                {filteredData.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No financial assistance records found matching your search criteria.</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default TotalFinancialAssistanceReport;
