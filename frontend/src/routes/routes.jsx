/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Main Layout Wrapper
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load Pages for performance optimization
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Orders = lazy(() => import('../pages/Orders'));
const Shipping = lazy(() => import('../pages/Shipping'));
const Analytics = lazy(() => import('../pages/Analytics'));
const BulkOperations = lazy(() => import('../pages/BulkOperations'));

// Sleek loading screen for lazy suspension fallback
const SuspenseFallback = () => (
  <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-slate-400">
    <Loader2 className="h-8 w-8 animate-spin text-amazon-orange mb-2" />
    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
      Loading view...
    </span>
  </div>
);

// Create and export central Router configuration
export const router = createBrowserRouter([
  // Public Route: Authentication Screen
  {
    path: '/login',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <Login />
      </Suspense>
    ),
  },

  // Protected Core Routes wrapped inside MainLayout shell
  {
    path: '/',
    element: <ProtectedRoute />, // Validates core authentication
    children: [
      {
        element: <MainLayout />, // Wraps children with sidebar/navbar frame
        children: [
          // Default redirect from root to dashboard
          {
            path: '',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <Dashboard />
              </Suspense>
            ),
          },
          {
            path: 'orders',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <Orders />
              </Suspense>
            ),
          },
          {
            path: 'shipping',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <Shipping />
              </Suspense>
            ),
          },

          // Admin Exclusive Views
          {
            path: 'admin',
            children: [
              {
                path: 'analytics',
                element: (
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Suspense fallback={<SuspenseFallback />}>
                      <Analytics />
                    </Suspense>
                  </ProtectedRoute>
                ),
              },
              {
                path: 'bulk-operations',
                element: (
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Suspense fallback={<SuspenseFallback />}>
                      <BulkOperations />
                    </Suspense>
                  </ProtectedRoute>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all Redirect for undefined endpoints
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
