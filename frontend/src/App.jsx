import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import router from './routes/routes';

function App() {
  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
