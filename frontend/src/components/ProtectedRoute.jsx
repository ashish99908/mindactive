import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-wrap" style={{ minHeight: '80vh' }}>
        <div className="spinner" />
        Checking your session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <Outlet />;
};

export default ProtectedRoute;
