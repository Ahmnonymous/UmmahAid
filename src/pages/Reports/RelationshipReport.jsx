import React, { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Table, Spinner, Alert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GET_RELATIONSHIP_REPORT } from '../../helpers/url_helper';

const RelationshipReport = () => {
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

            const response = await axios.get(GET_RELATIONSHIP_REPORT, {
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
            console.error('Error fetching relationship report:', err);
            setError(err.response?.data?.message || 'Error fetching relationship report');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.relatives_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.relatives_surname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const uniqueApplicants = new Set(data.map(item => item.file_number)).size;
    const totalRelationships = data.length;
    const relationshipTypes = [...new Set(data.map(item => item.relationship_type_name).filter(Boolean))];

    if (loading) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <Spinner color="primary" className="me-2" />
                        <span>Loading relationship report...</span>
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
                                <i className="bx bx-group me-2"></i>
                                Relationship Report
                            </h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link to="/dashboard">Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link to="/reports">Reports</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Relationship Report</li>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Total Relationships</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-primary fs-14 mb-0">{totalRelationships}</h5>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Unique Applicants</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-success fs-14 mb-0">{uniqueApplicants}</h5>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Relationship Types</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-info fs-14 mb-0">{relationshipTypes.length}</h5>
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
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Avg Relations/Applicant</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <h5 className="text-warning fs-14 mb-0">
                                            {uniqueApplicants > 0 ? (totalRelationships / uniqueApplicants).toFixed(1) : '0'}
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
                                                placeholder="Search by applicant name, file number, or relative name..."
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
                                                <th>Applicant Name</th>
                                                <th>File Number</th>
                                                <th>Contact</th>
                                                <th>Relationship Type</th>
                                                <th>Relative Name</th>
                                                <th>Age</th>
                                                <th>Gender</th>
                                                <th>Employment Status</th>
                                                <th>Education Level</th>
                                                <th>Health Condition</th>
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
                                                        <span className="badge bg-primary">
                                                            {item.relationship_type_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <strong>{item.relatives_name} {item.relatives_surname}</strong>
                                                    </td>
                                                    <td>{item.age || '-'}</td>
                                                    <td>
                                                        <span className="badge bg-info">
                                                            {item.gender_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${item.employment_status_name === 'Unemployed' ? 'danger' : 
                                                            item.employment_status_name?.includes('Employed') ? 'success' : 'secondary'}`}>
                                                            {item.employment_status_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td>{item.education_level_name || '-'}</td>
                                                    <td>{item.health_condition_name || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                
                                {filteredData.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No relationship records found matching your search criteria.</p>
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

export default RelationshipReport;
