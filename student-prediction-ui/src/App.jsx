import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import UserAnalyticsPage from './pages/UserAnalyticsPage';
import DashboardPage from './pages/DashboardPage';
import AtRiskStudentsPage from './pages/AtRiskStudentsPage';

// 1. IMPORT THE NEW RETRAIN BUTTON COMPONENT
import RetrainModelButton from './components/RetrainModelButton';

import { Navbar, Container, Nav } from 'react-bootstrap';
import logoImage from './assets/images/largeyool.png'; 
import './App.css'; 

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar expand="lg" className="app-navbar sticky-top">
          <Container>
            <Navbar.Brand as={NavLink} to="/">
              <img src={logoImage} alt="PresenceAI Logo" className="navbar-logo-img" />
              {/* Optional: Remove the text if the logo is sufficient */}
              {/* PresenceAI */}
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              {/* 2. MAIN NAVIGATION LINKS */}
              {/* Using "me-auto" pushes these links to the left, leaving space on the right */}
              <Nav className="me-auto">
                <Nav.Link as={NavLink} to="/">Home</Nav.Link>
                <Nav.Link as={NavLink} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={NavLink} to="/predict">Prediction</Nav.Link>
                <Nav.Link as={NavLink} to="/analytics">Analytics</Nav.Link>
                <Nav.Link as={NavLink} to="/at-risk">At-Risk Report</Nav.Link>
              </Nav>

              {/* 3. ACTION BUTTONS ON THE RIGHT */}
              {/* This new Nav component will be pushed to the far right */}
              <Nav>
                <RetrainModelButton />
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        
        <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/predict" element={<PredictionPage />} />
              <Route path="/analytics" element={<UserAnalyticsPage />} />
              <Route path="/at-risk" element={<AtRiskStudentsPage />} />
            </Routes>
        </main>
        
        <footer className="app-footer">
            <Container>
                <p className="mb-0">© {new Date().getFullYear()} Yool Education. All Rights Reserved 2025.</p>
            </Container>
        </footer>
      </div>
    </Router>
  );
}

export default App;