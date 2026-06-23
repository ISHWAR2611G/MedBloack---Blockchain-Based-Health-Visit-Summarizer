import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { getSession } from './api';
import Login from './pages/Login';
import AdminPortal from './pages/AdminPortal';
import HospitalPortal from './pages/HospitalPortal';
import DoctorPortal from './pages/DoctorPortal';
import PatientPortal from './pages/PatientPortal';
import { ToastProvider } from './components/ui/Toast';
import { LoadingProvider, useLoading } from './components/ui/LoadingContext';
import { LoadingBar } from './components/ui/LoadingBar';

// ENHANCEMENT: Trigger the LoadingBar on every route change
function RouteProgress() {
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    startLoading();
    const timeout = window.setTimeout(() => stopLoading(), 280);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, startLoading, stopLoading]);

  return null;
}

function LoadingBarWrapper() {
  const { active } = useLoading();
  return <LoadingBar active={active} />;
}

// Route guard — redirects to /login if not logged in or wrong role
function Protected({ role, children }) {
  const { user } = getSession();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function App() {
  const { user } = getSession();

  // Redirect logged-in users away from login page
  const defaultPath = user ? `/${user.role}` : '/login';

  return (
    <ToastProvider>
      <LoadingProvider>
        <BrowserRouter>
          <LoadingBarWrapper />
          <RouteProgress />
          <Routes>
            {/* Root — redirect based on auth state */}
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            {/* Login — redirect away if already signed in */}
            <Route path="/login" element={user ? <Navigate to={defaultPath} replace /> : <Login />} />
            {/* Protected portals */}
            <Route path="/admin"    element={<Protected role="admin"><AdminPortal /></Protected>} />
            <Route path="/hospital" element={<Protected role="hospital"><HospitalPortal /></Protected>} />
            <Route path="/doctor"   element={<Protected role="doctor"><DoctorPortal /></Protected>} />
            <Route path="/patient"  element={<Protected role="patient"><PatientPortal /></Protected>} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </LoadingProvider>
    </ToastProvider>
  );
}

export default App;
