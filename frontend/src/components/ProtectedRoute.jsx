import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const { t } = useLang();
  if (loading) {
    return (
      <div className="loading-wrap" style={{ minHeight: '80vh' }}>
        <div className="spinner" />
        {t('Checking your session…')}
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <Outlet />;
};

export default ProtectedRoute;
