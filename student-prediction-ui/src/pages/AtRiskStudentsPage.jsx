import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { Table, Spinner, Card, Form, Row, Col, Button } from 'react-bootstrap';
import { BsExclamationTriangleFill, BsSearch } from 'react-icons/bs';

const AtRiskStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    
    // State for the filter controls
    const [threshold, setThreshold] = useState(60); 
    const [minMeetings, setMinMeetings] = useState(5); // New state for minimum meetings

    const handleSearch = () => {
        setLoading(true);
        setError('');
        setHasSearched(true);

        // Pass both values to the API function
        api.getAtRiskStudents(threshold / 100, minMeetings)
            .then(setStudents)
            .catch(err => setError('Could not fetch at-risk students.'))
            .finally(() => setLoading(false));
    };
    
    // Initial search on page load
    useEffect(() => {
        handleSearch();
    }, []);

    return (
        <div className="page-container">
            <h2 className="page-header"><BsExclamationTriangleFill /> At-Risk Students Report</h2>
            
            <Card className="custom-card mb-4">
                <Card.Header as="h5">Report Filters</Card.Header>
                <Card.Body>
                    <Row className="align-items-end g-3">
                        {/* Attendance Rate Slider */}
                        <Col md={6}>
                            <Form.Label>Show students with attendance rate below: <strong>{threshold}%</strong></Form.Label>
                            <Form.Range 
                                value={threshold}
                                onChange={e => setThreshold(e.target.value)}
                                min="10"
                                max="90"
                                step="5"
                            />
                        </Col>

                        {/* Minimum Meetings Input */}
                        <Col md={3}>
                            <Form.Label>Minimum enrolled meetings:</Form.Label>
                            <Form.Control 
                                type="number"
                                value={minMeetings}
                                onChange={e => setMinMeetings(e.target.value)}
                                min="1"
                            />
                        </Col>

                        {/* Search Button */}
                        <Col md={3} className="d-grid">
                            <Button variant="primary" onClick={handleSearch} disabled={loading}>
                                <BsSearch /> {loading ? 'Searching...' : 'Apply Filters'}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="custom-card">
                <Card.Header as="h5">Report Results</Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-5"><Spinner animation="border" /></div>
                    ) : error ? (
                        <div className="feedback-container">{error}</div>
                    ) : (
                        <Table hover responsive className="custom-table">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Attended / Enrolled</th>
                                    <th>Attendance Rate</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? students.map(student => (
                                    <tr key={student.user_id}>
                                        <td><strong>{student.user_id}</strong></td>
                                        <td>{student.attended_meetings} / {student.enrolled_meetings}</td>
                                        <td>
                                            <span className="text-danger-custom fw-bold">
                                                {(student.overall_rate * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/analytics?user=${student.user_id}`} className="btn btn-sm btn-outline-primary">
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center p-4">
                                            {hasSearched ? 'No students found matching your criteria.' : 'Adjust the filters and click "Apply Filters" to see results.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default AtRiskStudentsPage;