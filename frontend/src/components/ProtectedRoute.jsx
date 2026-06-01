import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ShieldAlert, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Premium loading state while validating session integrity
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-amazon-orange mb-4" />
          <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-amazon-orange rounded-full animate-pulse"></div>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated? Redirect to login page and preserve target path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation: Ensure user has required clearance level
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-red-500/20 shadow-2xl animate-slide-up text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-400 mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your current account type (<span className="text-amazon-orange font-semibold uppercase text-xs">{user?.role}</span>) does not possess permission to view this administrative board.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium py-3 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If valid, render children (or Outlet for layout routes)
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
