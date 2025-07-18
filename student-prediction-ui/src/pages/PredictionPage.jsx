import React, { useState, useEffect } from 'react';
// CORRECTED IMPORT: Removed Defs, linearGradient, and Stop
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; 
import * as api from '../services/apiService';
import { Form, Table, Spinner, Card } from 'react-bootstrap';
import { BsMagic, BsGraphUp, BsTable, BsHourglassSplit, BsExclamationTriangleFill, BsInfoCircleFill, BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

const PredictionPage = () => {
    // ... all the state and useEffect logic remains the same ...
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
            .then(data => {
                if (Array.isArray(data)) {
                    setPredictions(data);
                } else {
                    setPredictions([]);
                    if(data.message) setError(data.message);
                }
            })
            .catch(err => {
                setError(err.message || 'An unknown error occurred during prediction.');
            })
            .finally(() => setLoading(false));
    }, [selectedMeeting]);


    const renderContent = () => {
        // ... loading, error, and empty state logic remains the same ...
        if (loading) {
            return (
                <div className="feedback-container">
                    <Spinner animation="border" style={{ color: 'var(--accent-color)', width: '3rem', height: '3rem' }}/>
                    <p className="mt-3 fs-5">Calculating Predictions...</p>
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
        if (!selectedMeeting) {
             return (
                <div className="feedback-container">
                    <BsInfoCircleFill />
                    <p className="mt-3 fs-5">Please select a meeting to see predictions.</p>
                </div>
             );
        }
        if (predictions.length === 0) {
            return (
                <div className="feedback-container">
                    <BsInfoCircleFill />
                    <p className="mt-3 fs-5">No users found or no predictions available for this meeting.</p>
                </div>
            );
        }
       
        return (
            <>
                {/* Table card is unchanged */}
                <Card className="mb-4 custom-card">
                    <Card.Header as="h5" className="d-flex align-items-center gap-2"><BsTable /> Prediction Results</Card.Header>
                    <Card.Body>
                        <Table hover responsive className="custom-table">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Probability of Presence</th>
                                    <th>Prediction</th>
                                </tr>
                            </thead>
                            <tbody>
                                {predictions.map(p => (
                                    <tr key={p.user_id}>
                                        <td><strong>{p.user_id}</strong></td>
                                        <td>{(p.probability_of_presence * 100).toFixed(1)}%</td>
                                        <td className={p.prediction === 1 ? 'text-success-custom' : 'text-danger-custom'}>
                                            <div className="prediction-status">
                                                {p.prediction === 1 ? <BsCheckCircleFill /> : <BsXCircleFill />}
                                                <span>{p.prediction === 1 ? 'PRESENT' : 'ABSENT'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Chart card with corrected SVG tags */}
                <Card className="custom-card">
                     <Card.Header as="h5" className="d-flex align-items-center gap-2"><BsGraphUp /> Probability Distribution</Card.Header>
                     <Card.Body>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={predictions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                {/* CORRECTED: Use lowercase svg tags */}
                                <defs>
                                    <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.9}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="user_id" stroke="var(--secondary-text-color)" />
                                <YAxis domain={[0, 1]} stroke="var(--secondary-text-color)" tickFormatter={(value) => `${value * 100}%`} />
                                <Tooltip
                                    cursor={{fill: 'rgba(224, 231, 255, 0.4)'}}
                                    contentStyle={{ 
                                        backgroundColor: 'var(--card-bg-color)',
                                        borderRadius: '8px', 
                                        borderColor: 'var(--border-color)',
                                    }}
                                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Presence Probability"]}
                                />
                                <Bar dataKey="probability_of_presence" fill="url(#predictionGradient)" name="Presence Probability" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                     </Card.Body>
                </Card>
            </>
        );
    };

    // ... return statement is unchanged ...
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