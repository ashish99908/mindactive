import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import Games from './pages/Games.jsx';
import GamePlay from './pages/GamePlay.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';
import CaretakerDashboard from './pages/CaretakerDashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import AIAnalysis from './pages/AIAnalysis.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/games" element={<Games />} />
            <Route path="/patient/game/:gameId" element={<GamePlay />} />
            <Route path="/patient/progress" element={<Progress />} />
            <Route path="/patient/profile" element={<Profile />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['caretaker']} />}>
            <Route path="/caretaker/dashboard" element={<CaretakerDashboard />} />
            <Route path="/caretaker/patients" element={<Patients />} />
            <Route path="/caretaker/patient/:id" element={<PatientDetail />} />
            <Route path="/caretaker/analytics" element={<Analytics />} />
            <Route path="/caretaker/ai-analysis" element={<AIAnalysis />} />
            <Route path="/caretaker/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;