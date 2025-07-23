import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../services/apiService';
import { Form, Table, Spinner, Card, Row, Col, Button } from 'react-bootstrap';
import { BsBarChartLineFill, BsPeopleFill, BsPersonCheckFill, BsCalendarWeek, BsInfoCircleFill, BsExclamationTriangleFill, BsChevronDown, BsChevronUp } from 'react-icons/bs';

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

const AttendanceProgressBar = ({ rate }) => {
    const percentage = (rate * 100).toFixed(1);
    return (
        <div className="attendance-progress-bar" title={`${percentage}%`}>
            <div className="attendance-progress-bar-inner" style={{ width: `${percentage}%` }}>
                {percentage}%
            </div>
        </div>
    );
};

const UserAnalyticsPage = () => {
    const [searchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAll, setShowAll] = useState(false);
    const PREVIEW_COUNT = 5;

    useEffect(() => {
        api.getUsers().then(setUsers).catch(err => setError('Could not fetch users.'));
    }, []);

    useEffect(() => {
        const userFromUrl = searchParams.get('user');
        if (userFromUrl) {
            setSelectedUser(userFromUrl);
        }
    }, []);

    useEffect(() => {
        if (!selectedUser) {
            setStats(null);
            setPerformance([]);
            return;
        }
        setShowAll(false);
        setLoading(true);
        setError('');
        const fetchUserData = async () => {
            try {
                const [statsData, performanceData] = await Promise.all([
                    api.getUserStats(selectedUser),
                    api.getUserMeetingPerformance(selectedUser)
                ]);
                setStats(statsData);
                setPerformance(performanceData);
            } catch (err) {
                setError(err.message || 'Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [selectedUser]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="feedback-container">
                    <Spinner animation="border" style={{ color: 'var(--accent-color)', width: '3rem', height: '3rem' }}/>
                    <p className="mt-3 fs-5">Loading User Data...</p>
                </div>
            );
        }
        if (error) {
             return (
                 <div className="feedback-container">
                    <BsExclamationTriangleFill style={{ color: 'var(--danger-color)' }}/>
                    <p className="mt-3 fs-5 text-danger-custom">{error}</p>
                </div>
            );
        }
        if (!selectedUser) {
             return (
                <div className="feedback-container">
                    <BsInfoCircleFill />
                    <p className="mt-3 fs-5">Please select a user to see their analytics.</p>
                </div>
             );
        }

        // ===================================================================
        // === THIS IS THE CRUCIAL FIX, RESTORING YOUR ORIGINAL LOGIC      ===
        // We must check if `stats` is null before trying to render with it.
        // ===================================================================
        if (!stats) {
             return (
                <div className="feedback-container">
                    <BsInfoCircleFill />
                    <p className="mt-3 fs-5">No data available for this user.</p>
                </div>
            );
        }
        
        const displayedPerformance = showAll ? performance : performance.slice(0, PREVIEW_COUNT);

        return (
             <>
                <h4 className="mb-3" style={{fontWeight: 500}}>Overall Record for User {selectedUser}</h4>
                <Row className="mb-4 g-4">
                    <Col lg={4} md={6}><StatCard title="Total Enrolled Meetings" value={stats.total_enrolled_meetings} icon={<BsCalendarWeek />} /></Col>
                    <Col lg={4} md={6}><StatCard title="Attended Meetings" value={stats.attended_meetings} icon={<BsPersonCheckFill />} /></Col>
                    <Col lg={4} md={6}><StatCard title="Personal Presence Rate" value={`${(stats.personal_presence_rate * 100).toFixed(1)}%`} icon={<BsBarChartLineFill />} /></Col>
                </Row>
                
                <Card className="custom-card">
                    <Card.Header as="h5">Performance per Meeting</Card.Header>
                    <Card.Body>
                        {performance.length > 0 ? (
                            <Table hover responsive className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Meeting Title</th>
                                        <th>Scheduled Day</th>
                                        <th>Attendees</th>
                                        <th style={{minWidth: '150px'}}>Class Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPerformance.map((p, index) => (
                                        <tr key={index}>
                                            <td><strong>{p.meeting_title}</strong></td>
                                            <td>{p.scheduled_day}</td>
                                            <td>{p.attendees_string}</td>
                                            <td>
                                                <AttendanceProgressBar rate={p.class_attendance_rate} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center p-4">No meeting performance data available for this user.</div>
                        )}
                        
                        {performance.length > PREVIEW_COUNT && (
                            <div className="text-center mt-3">
                                <Button variant="outline-primary" onClick={() => setShowAll(!showAll)}>
                                    {showAll ? (
                                        <><BsChevronUp /> Show Less</>
                                    ) : (
                                        <><BsChevronDown /> Show All ({performance.length}) Records</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
             </>
        );
    }
    
    return (
        <div className="page-container">
            <h2 className="page-header"><BsPeopleFill /> User Attendance Analytics</h2>
            <Form.Select 
                aria-label="Select User"
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
                disabled={users.length === 0}
                className="mb-4 custom-form-select"
            >
                <option value="">-- Select a User --</option>
                {users.map(user => (
                    <option key={user.id} value={user.id}>User {user.id}</option>
                ))}
            </Form.Select>
            {renderContent()}
        </div>
    );
};

export default UserAnalyticsPage;