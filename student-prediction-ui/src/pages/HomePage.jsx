import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsArrowRight, BsMagic, BsBarChartLineFill, BsLightbulb } from 'react-icons/bs';

const Feature = ({ icon, title, text }) => (
    <Col md={4} className="mb-4">
        <div className="feature-card">
            <div className="feature-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{text}</p>
        </div>
    </Col>
);

const HomePage = () => {
    return (
        <div>
            {/* Hero Section */}
            <div className="hero-section">
                <Container>
                    <h1>Yool Education Prediction App</h1>
                    
                    <div>
                        <Link to="/predict" className="cta-button cta-primary">
                            Predict Attendance <BsArrowRight />
                        </Link>
                        <Link to="/analytics" className="cta-button cta-secondary">
                            View Analytics
                        </Link>
                    </div>
                </Container>
            </div>

            {/* Features Section */}
            <Container className="features-section">
                <Row>
                    <Feature
                        icon={<BsMagic />}
                        title="Real-Time Predictions"
                        text="Instantly forecast attendance for upcoming meetings, allowing educators to prepare and intervene effectively."
                    />
                    <Feature
                        icon={<BsBarChartLineFill />}
                        title="In-Depth Analytics"
                        text="Visualize individual student performance and track presence rates across all enrolled courses."
                    />
                    <Feature
                        icon={<BsLightbulb />}
                        title="Data-Driven Decisions"
                        text="Use historical data and predictive insights to build better schedules and support at-risk students."
                    />
                </Row>
            </Container>
        </div>
    );
};

export default HomePage;