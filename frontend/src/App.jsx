import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import WardenPage from './pages/WardenPage';
import AdminPage from './pages/AdminPage';
import StudentProfilePage from './pages/StudentProfilePage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin"   replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/warden" replace />;
}

// Generic protected route — redirects to login if not authenticated
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
