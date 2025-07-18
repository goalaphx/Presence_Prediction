import React, { useState, useEffect } from 'react';
import * as api from '../services/apiService';
import { Form, Table, Spinner, Card, Row, Col } from 'react-bootstrap';
import { BsBarChartLineFill, BsPeopleFill, BsPersonCheckFill, BsCalendarWeek, BsInfoCircleFill, BsExclamationTriangleFill } from 'react-icons/bs';

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

const UserAnalyticsPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getUsers().then(setUsers).catch(err => setError('Could not fetch users.'));
    }, []);

    useEffect(() => {
        if (!selectedUser) {
            setStats(null);
            setPerformance([]);
            return;
        }
        
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
        if (!stats) {
             return (
                <div className="feedback-container">
                    <BsInfoCircleFill />
                    <p className="mt-3 fs-5">No data available for this user.</p>
                </div>
            );
        }
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
                        <Table hover responsive className="custom-table">
                            <thead>
                                <tr>
                                    <th>Meeting Title</th>
                                    <th>Scheduled Day</th>
                                    <th>Scheduled Time</th>
                                    <th>Attendees</th>
                                    <th>Class Attendance Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performance.map((p, index) => (
                                    <tr key={index}>
                                        <td><strong>{p.meeting_title}</strong></td>
                                        <td>{p.scheduled_day}</td>
                                        <td>{p.scheduled_time}</td>
                                        <td>{p.attendees_string}</td>
                                        <td>{(p.class_attendance_rate * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
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