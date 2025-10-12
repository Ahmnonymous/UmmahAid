import React, { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Table, Spinner, Alert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GET_HOME_VISITS_REPORT } from '../../helpers/url_helper';

const HomeVisitsReport = () => {
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

            const response = await axios.get(GET_HOME_VISITS_REPORT, {
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
            console.error('Error fetching home visits:', err);
            setError(err.response?.data?.message || 'Error fetching home visits');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.representative?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const uniqueRepresentatives = [...new Set(data.map(item => item.representative).filter(Boolean))];
    const uniqueRecipients = new Set(data.map(item => item.file_number)).size;

    if (loading) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <Spinner color="primary" className="me-2" />
                        <span>Loading home visits report...</span>
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
                                <i className="bx bx-car me-2"></i>
                                Home Visits Report
                            </h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link to="/dashboard">Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link to="/reports">Reports</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Home Visits</li>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Total Visits</p>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Unique Recipients</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-success fs-14 mb-0">{uniqueRecipients}</h5>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Representatives</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-info fs-14 mb-0">{uniqueRepresentatives.length}</h5>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Avg Visits/Recipient</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-warning fs-14 mb-0">
                                            {uniqueRecipients > 0 ? (data.length / uniqueRecipients).toFixed(1) : '0'}
                                        </h5>
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
                                                placeholder="Search by name, file number, or representative..."
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
                                                <th>Visit Date</th>
                                                <th>Representative</th>
                                                <th>Comments</th>
                                                <th>Attachments</th>
                                                <th>Created Date</th>
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
                                                    <td>{formatDate(item.visit_date)}</td>
                                                    <td>
                                                        <span className="badge bg-info">
                                                            {item.representative || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ maxWidth: '200px' }}>
                                                            {item.comments ? (
                                                                <span 
                                                                    title={item.comments}
                                                                    className="text-truncate d-inline-block"
                                                                >
                                                                    {item.comments.length > 50 
                                                                        ? `${item.comments.substring(0, 50)}...` 
                                                                        : item.comments
                                                                    }
                                                                </span>
                                                            ) : '-'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            {item.attachment_1 && (
                                                                <span className="badge bg-secondary me-1">
                                                                    <i className="bx bx-paperclip me-1"></i>
                                                                    File 1
                                                                </span>
                                                            )}
                                                            {item.attachment_2 && (
                                                                <span className="badge bg-secondary">
                                                                    <i className="bx bx-paperclip me-1"></i>
                                                                    File 2
                                                                </span>
                                                            )}
                                                            {!item.attachment_1 && !item.attachment_2 && '-'}
                                                        </div>
                                                    </td>
                                                    <td>{formatDate(item.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                
                                {filteredData.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No home visits found matching your search criteria.</p>
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

export default HomeVisitsReport;
