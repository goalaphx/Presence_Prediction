import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as api from '../services/apiService';
import { Form, Table, Spinner, Card, Row, Col } from 'react-bootstrap';
import { BsMagic, BsGraphUp, BsTable, BsInfoCircleFill, BsExclamationTriangleFill, BsPersonCheckFill, BsPersonXFill, BsPercent } from 'react-icons/bs';
import PredictionBadge from '../components/PredictionBadge'; // Import the new badge component

// A small component for our new summary cards
const SummaryCard = ({ icon, value, title, iconClass }) => (
    <div className="summary-stat-card">
        <div className={`icon ${iconClass}`}>{icon}</div>
        <div className="value">{value}</div>
        <div className="title">{title}</div>
    </div>
);

// A custom tooltip for a richer chart experience
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // The full data object for the bar
        return (
            <div className="recharts-custom-tooltip">
                <p className="label"><strong>User ID: {label}</strong></p>
                <p>Probability: {(data.probability_of_presence * 100).toFixed(1)}%</p>
                <div>Prediction: <PredictionBadge isPresent={data.prediction === 1} /></div>
            </div>
        );
    }
    return null;
};

const PredictionPage = () => {
    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getMeetings()
            .then(setMeetings)
            .catch(err => setError('Could not fetch meetings. Is the backend API running?'));
    }, []);

    useEffect(() => {
        if (!selectedMeeting) {
            setPredictions([]);
            return;
        }
        setLoading(true);
        setError('');
        api.getPredictionsForMeeting(selectedMeeting)
            .then(data => Array.isArray(data) ? setPredictions(data) : setPredictions([]))
            .catch(err => setError(err.message || 'An unknown error occurred during prediction.'))
            .finally(() => setLoading(false));
    }, [selectedMeeting]);

    const renderContent = () => {
        if (loading) { /* ... no changes to loading/error/empty states ... */ }
        // ...

        // --- Calculate Summary Stats ---
        const predictedPresent = predictions.filter(p => p.prediction === 1).length;
        const predictedAbsent = predictions.length - predictedPresent;
        const predictedRate = predictions.length > 0 ? (predictedPresent / predictions.length * 100).toFixed(1) : 0;
       
        return (
            <>
                {/* --- NEW: Summary Section --- */}
                <Row className="g-4 mb-4">
                    <Col md={4}>
                        <SummaryCard icon={<BsPersonCheckFill/>} value={predictedPresent} title="Predicted Present" iconClass="present" />
                    </Col>
                    <Col md={4}>
                        <SummaryCard icon={<BsPersonXFill/>} value={predictedAbsent} title="Predicted Absent" iconClass="absent" />
                    </Col>
                    <Col md={4}>
                        <SummaryCard icon={<BsPercent/>} value={`${predictedRate}%`} title="Predicted Presence Rate" iconClass="rate" />
                    </Col>
                </Row>
                
                {/* --- Enhanced Layout for Table and Chart --- */}
                <Row className="g-4">
                    <Col lg={7}>
                        <Card className="custom-card h-100">
                            <Card.Header as="h5" className="d-flex align-items-center gap-2"><BsTable /> Detailed Predictions</Card.Header>
                            <Card.Body>
                                <Table hover responsive className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Probability</th>
                                            <th className="text-center">Prediction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {predictions.map(p => (
                                            <tr key={p.user_id}>
                                                <td><strong>{p.user_id}</strong></td>
                                                <td>{(p.probability_of_presence * 100).toFixed(1)}%</td>
                                                <td className="text-center">
                                                    <PredictionBadge isPresent={p.prediction === 1} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="custom-card h-100">
                            <Card.Header as="h5" className="d-flex align-items-center gap-2"><BsGraphUp /> Probability Distribution</Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={500}>
                                    <BarChart data={predictions} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} stroke="var(--secondary-text-color)"/>
                                        <YAxis type="category" dataKey="user_id" stroke="var(--secondary-text-color)" width={80}/>
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(224, 231, 255, 0.4)'}} />
                                        <Bar dataKey="probability_of_presence" barSize={20}>
                                            {predictions.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.prediction === 1 ? 'var(--success-color)' : 'var(--danger-color)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    };

    return (
        <div className="page-container">
            <h2 className="page-header"><BsMagic /> Real-Time Attendance Prediction</h2>
            <Form.Select 
                aria-label="Select Meeting"
                value={selectedMeeting} 
                onChange={e => setSelectedMeeting(e.target.value)}
                disabled={meetings.length === 0}
                className="mb-4 custom-form-select"
            >
                <option value="">-- Select a Meeting --</option>
                {meetings.map(meeting => (
                    <option key={meeting.id} value={meeting.id}>
                        {meeting.titre_fr}
                    </option>
                ))}
            </Form.Select>
            {renderContent()}
        </div>
    );
};

export default PredictionPage;