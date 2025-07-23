import React, { useState, useEffect } from 'react';
import * as api from '../services/apiService';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { BsGrid1X2Fill, BsPeopleFill, BsJournalCheck, BsBarChartFill, BsSpeedometer2 } from 'react-icons/bs';

// Re-using the StatCard component structure for consistency
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

    if (loading) {
        return <div className="feedback-container"><Spinner animation="border" variant="primary" /></div>;
    }

    if (error) {
        return <div className="feedback-container"><p>{error}</p></div>;
    }

    return (
        <div className="page-container">
            <h2 className="page-header"><BsSpeedometer2 /> General Statistics</h2>
            <Row className="g-4">
                <Col lg={3} md={6}>
                    <StatCard title="Total Students" value={stats.total_students} icon={<BsPeopleFill />} />
                </Col>
                <Col lg={3} md={6}>
                    <StatCard title="Total Classes" value={stats.total_classes} icon={<BsJournalCheck />} />
                </Col>
                <Col lg={3} md={6}>
                    <StatCard title="Total Meetings Held" value={stats.total_meetings_held} icon={<BsGrid1X2Fill />} />
                </Col>
                <Col lg={3} md={6}>
                    <StatCard title="Overall Attendance Rate" value={`${(stats.overall_attendance_rate * 100).toFixed(1)}%`} icon={<BsBarChartFill />} />
                </Col>
            </Row>

            {/* You can add charts or other components here in the future! */}
        </div>
    );
};

export default DashboardPage;