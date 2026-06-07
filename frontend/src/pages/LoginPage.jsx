import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function LoginPage() {
  const { login, studentLogin, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('staff'); // 'staff' | 'student'

  // Staff form
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Student form
  const [rollNo, setRollNo]           = useState('');
  const [stuPassword, setStuPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Already logged in → redirect
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin')   navigate('/admin', { replace: true });
    else if (user.role === 'student') navigate('/student', { replace: true });
    else navigate('/warden', { replace: true });
  }, [user, navigate]);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/warden');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await studentLogin(rollNo, stuPassword);
      navigate('/student');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="GEC Wayanad Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} className="mb-3 shrink-0" />
          <h1 className="text-2xl font-bold text-slate-800">HostelTrack</h1>
          <p className="text-xs text-blue-600 font-medium mt-1">GEC Wayanad</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {[
              { id: 'staff',   icon: '🔐', label: 'Staff Login' },
              { id: 'student', icon: '🎓', label: 'Student Login' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); }}
                className={[
                  'flex-1 py-3 text-sm font-medium transition-all cursor-pointer',
                  tab === t.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-700 bg-slate-50',
                ].join(' ')}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Staff Login ── */}
            {tab === 'staff' && (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hostel.com"
                    className={inputCls}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                    ⚠️ {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? <><Spinner size="sm" /> Loading...</> : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── Student Login ── */}
            {tab === 'student' && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">College ID (Roll No)</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                    placeholder="CST221"
                    className={`${inputCls} uppercase`}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={stuPassword}
                    onChange={(e) => setStuPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Default password is your Roll No in lowercase
                </p>
                {error && (
                  <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                    ⚠️ {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? <><Spinner size="sm" /> Loading...</> : 'View My Profile'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          HostelTrack © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
