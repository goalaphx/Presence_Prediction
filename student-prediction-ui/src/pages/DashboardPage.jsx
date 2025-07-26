import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { Row, Col, Card, Spinner, Table, Button } from 'react-bootstrap';
import { BsGrid1X2Fill, BsPeopleFill, BsJournalCheck, BsBarChartFill, BsSpeedometer2, BsMagic, BsExclamationTriangleFill, BsChevronRight } from 'react-icons/bs';

// StatCard component remains the same
const StatCard = ({ title, value, icon }) => (
    <Card className="custom-card stat-card">
        <Card.Body>
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-info">
                <Card.Title>{title}</Card.Title>
                <Card.Text>{value}</Card.Text>
            </div>
        </Card.Body>
    </Card>
);

// New component for actionable links
const QuickActionCard = ({ to, icon, title }) => (
    <Col md={4}>
        <Link to={to} className="quick-action-card">
            <div className="icon">{icon}</div>
            <div className="title">{title}</div>
        </Link>
    </Col>
);

// A new widget to show a preview of at-risk students
const AtRiskStudentsWidget = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch top 5 students with attendance below 60%
        api.getAtRiskStudents(0.60, 5)
           .then(data => setStudents(data.slice(0, 5))) // Ensure we only show a max of 5
           .catch(console.error)
           .finally(() => setLoading(false));
    }, []);

    return (
        <Card className="custom-card h-100">
            <Card.Header as="h5" className="d-flex align-items-center gap-2">
                <BsExclamationTriangleFill /> At-Risk Students Preview
            </Card.Header>
            <Card.Body>
                {loading ? (
                    <div className="text-center"><Spinner animation="border" size="sm"/></div>
                ) : students.length === 0 ? (
                    <p className="text-muted text-center">No students currently identified as at-risk. Great news!</p>
                ) : (
                    <Table hover responsive className="custom-table mb-0">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Attendance Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.user_id}>
                                    <td><strong>{student.user_id}</strong></td>
                                    <td className="text-danger-custom fw-bold">{(student.overall_rate * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
            <Card.Footer className="text-center">
                <Link to="/at-risk">
                    View Full Report <BsChevronRight />
                </Link>
            </Card.Footer>
        </Card>
    );
};

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getSystemOverview()
            .then(setStats)
            .catch(err => setError('Could not load dashboard statistics.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading || !stats) {
        return <div className="feedback-container"><Spinner animation="border" variant="primary" /></div>;
    }

    if (error) {
        return <div className="feedback-container"><p>{error}</p></div>;
    }

    return (
        <div className="page-container">
            <h2 className="page-header"><BsSpeedometer2 /> System Dashboard</h2>
            <Row className="g-4">
                {/* Left Column: Stats & Actions */}
                <Col lg={7}>
                    <Row className="g-4">
                        <Col md={6}><StatCard title="Total Students" value={stats.total_students} icon={<BsPeopleFill />} /></Col>
                        <Col md={6}><StatCard title="Active Courses" value={stats.total_classes} icon={<BsJournalCheck />} /></Col>
                        <Col md={6}><StatCard title="Total Meetings Held" value={stats.total_meetings_held} icon={<BsGrid1X2Fill />} /></Col>
                        <Col md={6}><StatCard title="Overall Attendance Rate" value={`${(stats.overall_attendance_rate * 100).toFixed(1)}%`} icon={<BsBarChartFill />} /></Col>
                    </Row>
                    <h4 className="mt-5 mb-3">Quick Actions</h4>
                    <Row className="g-3">
                        <QuickActionCard to="/predict" icon={<BsMagic />} title="Run a New Prediction" />
                        <QuickActionCard to="/analytics" icon={<BsPeopleFill />} title="Analyze a Student" />
                        <QuickActionCard to="/at-risk" icon={<BsExclamationTriangleFill />} title="View At-Risk Report" />
                    </Row>
                </Col>

                {/* Right Column: Widgets */}
                <Col lg={5}>
                    <AtRiskStudentsWidget />
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;