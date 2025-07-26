import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsArrowRight, BsMagic, BsBarChartLineFill, BsLightbulb, BsDatabaseCheck, BsGraphUp, BsPersonVideo3 } from 'react-icons/bs';

const Feature = ({ icon, title, text }) => (
    <Col md={4} className="mb-4">
        <div className="feature-card">
            <div className="feature-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{text}</p>
        </div>
    </Col>
);

const HowItWorksStep = ({ icon, title, text }) => (
    <Col md={4}>
        <div className="how-it-works-step">
            <div className="icon-wrapper">{icon}</div>
            <h4>{title}</h4>
            <p className="text-muted">{text}</p>
        </div>
    </Col>
);

const HomePage = () => {
    return (
        <div>
            {/* --- Enhanced Hero Section --- */}
            <div className="hero-section hero-with-bg">
                <Container className="text-center">
                    <h1>Transforming Education with Predictive Insights</h1>
                    <p className="lead">
                        Leverage the power of machine learning to understand student attendance patterns, identify at-risk individuals, and make data-driven decisions to foster success.
                    </p>
                    <div>
                        <Link to="/dashboard" className="cta-button cta-primary">
                            Go to Dashboard <BsArrowRight />
                        </Link>
                        <Link to="/predict" className="cta-button cta-secondary">
                            Run a Prediction
                        </Link>
                    </div>
                </Container>
            </div>

            {/* --- NEW: "How It Works" Section --- */}
            <Container className="features-section">
                <h2 className="section-title">How It Works</h2>
                <Row>
                    <HowItWorksStep 
                        icon={<BsDatabaseCheck />}
                        title="1. Analyze Data"
                        text="This system securely connects to your historical attendance and enrollment data, forming the basis for all insights."
                    />
                    <HowItWorksStep 
                        icon={<BsGraphUp />}
                        title="2. Predict Outcomes"
                        text="A pre-trained machine learning model analyzes patterns to forecast attendance for upcoming sessions with high accuracy."
                    />
                    <HowItWorksStep 
                        icon={<BsPersonVideo3 />}
                        title="3. Act Proactively"
                        text="Use the dashboard and reports to identify struggling students and provide timely support before they fall behind."
                    />
                </Row>
            </Container>

            {/* --- Existing Features Section --- */}
            <div style={{backgroundColor: 'var(--bg-color)', padding: '5rem 0'}}>
                <Container>
                    <h2 className="section-title">Core Features</h2>
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
                            title="At-Risk Identification"
                            text="Automatically generate reports on students with declining attendance rates, enabling proactive support."
                        />
                    </Row>
                </Container>
            </div>
        </div>
    );
};

export default HomePage;