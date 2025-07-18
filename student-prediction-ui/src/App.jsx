import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import UserAnalyticsPage from './pages/UserAnalyticsPage';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { GiBrain } from 'react-icons/gi'; // A nice icon for the logo
import './App.css'; // Make sure this is imported
import logoImage from './assets/images/largeyool.png'; 

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar expand="lg" className="app-navbar sticky-top">
          <Container>
            <Navbar.Brand as={NavLink} to="/">
              <img 
                src={logoImage} 
                alt="PresenceAI Logo" 
                className="navbar-logo-img" 
              />
              Prediction App
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                {/* NavLink will automatically get the 'active' class */}
                <Nav.Link as={NavLink} to="/">Home</Nav.Link>
                <Nav.Link as={NavLink} to="/predict">Prediction</Nav.Link>
                <Nav.Link as={NavLink} to="/analytics">Analytics</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        
        {/* Main content will grow to push footer down */}
        <main style={{ flex: 1 }}>
            {/* The routes no longer need a <Container> as pages handle their own layout */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/predict" element={<PredictionPage />} />
              <Route path="/analytics" element={<UserAnalyticsPage />} />
            </Routes>
        </main>
        
        <footer className="app-footer">
            <Container>
                <p className="mb-0">© {new Date().getFullYear()} Yool Education. All Rights Reserved.</p>
            </Container>
        </footer>
      </div>
    </Router>
  );
}

export default App;