import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';

// Lazy-load heavy pages to reduce initial bundle and speed up first load
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const WardenPage        = lazy(() => import('./pages/WardenPage'));
const AdminPage         = lazy(() => import('./pages/AdminPage'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="indigo" />
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading...</p>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin"   replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/warden" replace />;
}

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/warden" element={
              <Guard roles={['warden', 'admin']}><WardenPage /></Guard>
            } />

            <Route path="/admin" element={
              <Guard roles={['admin']}><AdminPage /></Guard>
            } />

            <Route path="/student" element={
              <Guard roles={['student']}><StudentProfilePage /></Guard>
            } />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
