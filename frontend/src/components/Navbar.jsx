import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const patientLinks = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/patient/games', label: 'Games', icon: '🎮' },
  { to: '/patient/progress', label: 'Progress', icon: '📈' },
  { to: '/patient/profile', label: 'Profile', icon: '👤' },
];

const caretakerLinks = [
  { to: '/caretaker/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/caretaker/patients', label: 'Patients', icon: '👥' },
  { to: '/caretaker/analytics', label: 'Analytics', icon: '📊' },
  { to: '/caretaker/ai-analysis', label: 'AI Analysis', icon: '🤖' },
  { to: '/caretaker/profile', label: 'Profile', icon: '👤' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const isPatient = user?.role === 'patient';
  const links = user ? (isPatient ? patientLinks : caretakerLinks) : [];

  // Auth pages (login/register) get a minimal transparent bar
  const onAuthPage = ['/login', '/register'].includes(location.pathname);

  if (!user) {
    return (
      <nav className="nav" style={onAuthPage ? { background: 'transparent', boxShadow: 'none' } : undefined}>
        <Link to="/" className="nav-brand">
          <span className="nav-logo">🧠</span> Smriti<span className="brand-accent">Loom</span>
        </Link>
        <div className="nav-actions">
          <Link to="/login"><button className="ghost small">Login</button></Link>
          <Link to="/register"><button className="small">Get Started</button></Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to={isPatient ? '/patient/dashboard' : '/caretaker/dashboard'} className="nav-brand">
          <span className="nav-logo">🧠</span> Smriti<span className="brand-accent">Loom</span>
        </Link>

        <div className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-link-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          <div className="nav-user" title={user.email}>
            <span className="nav-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className="nav-user-name">{user.name?.split(' ')[0]}</span>
          </div>
          <button className="danger small" onClick={handleLogout}>Logout</button>
          <button
            className="nav-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="nav-mobile">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-link-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
          <button className="danger small" style={{ margin: '10px 16px' }} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
