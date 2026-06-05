import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    navigate('/warden', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/warden', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
         style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)' }}>

      <div className="w-full max-w-sm">
        <Card padding="lg">
          {/* ── Header ── */}
          <div className="text-center mb-6">
            <span className="text-5xl block mb-3" role="img" aria-label="School">
              🏫
            </span>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              HostelTrack
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hostel Attendance System
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              GEC Wayanad
            </p>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-[var(--color-border)] mb-6" />

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="warden@hostel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3
                           text-sm text-slate-800 placeholder-slate-400
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           outline-none transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3
                           text-sm text-slate-800 placeholder-slate-400
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           outline-none transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl
                            bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Footer ── */}
          <p className="text-xs text-slate-400 text-center mt-6">
            Contact admin to get your credentials
          </p>
        </Card>
      </div>
    </div>
  );
}
