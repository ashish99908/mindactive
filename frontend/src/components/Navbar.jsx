import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

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
  const { t } = useLang();
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
      <nav className={`nav ${onAuthPage ? 'nav-auth' : 'nav-public'}`} style={onAuthPage ? { background: 'transparent', boxShadow: 'none' } : undefined}>
        <div className="nav-inner" style={{ flexWrap: 'wrap', rowGap: 6 }}>
          <Link to="/" className="nav-brand">
            <span className="nav-logo">🧠</span> Smriti<span className="brand-accent">Loom</span>
          </Link>
          <div className="nav-actions">
            <LanguageSwitcher />
            <Link to="/login"><button className="ghost small">{t('Login')}</button></Link>
            <Link to="/register"><button className="small">{t('Get Started')}</button></Link>
          </div>
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
              {t(l.label)}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          <LanguageSwitcher />
          <div className="nav-user" title={user.email}>
            <span className="nav-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className="nav-user-name">{user.name?.split(' ')[0]}</span>
          </div>
          <button className="danger small" onClick={handleLogout}>{t('Logout')}</button>
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
              {t(l.label)}
            </NavLink>
          ))}
          <div style={{ margin: '10px 16px', display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher />
          </div>
          <button className="danger small" style={{ margin: '10px 16px' }} onClick={handleLogout}>{t('Logout')}</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
