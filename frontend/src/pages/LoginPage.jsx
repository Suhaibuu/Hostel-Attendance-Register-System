import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ChevronRight } from 'lucide-react';

// Detect if input looks like an email (staff) or roll-no (student)
const looksLikeEmail = (val) => val.includes('@') || val.includes('.');
const looksLikeRollNo = (val) => /^[A-Za-z]{2,4}\d/.test(val.trim());

export default function LoginPage() {
  const { login, studentLogin, user } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(''); // email or rollNo
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Derive detected mode from identifier
  const detectedMode = (() => {
    if (!identifier.trim()) return null;
    if (looksLikeEmail(identifier)) return 'staff';
    if (looksLikeRollNo(identifier)) return 'student';
    return null;
  })();

  // Already logged in → redirect
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin')   navigate('/admin',   { replace: true });
    else if (user.role === 'student') navigate('/student', { replace: true });
    else navigate('/warden', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Please enter your email or roll number'); return; }
    if (!password)          { setError('Please enter your password'); return; }

    setLoading(true);
    try {
      const isStudent = !looksLikeEmail(identifier);
      if (isStudent) {
        await studentLogin(identifier.trim().toUpperCase(), password);
        navigate('/student');
      } else {
        const data = await login(identifier.trim(), password);
        if (data.user.role === 'admin') navigate('/admin');
        else navigate('/warden');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const modeLabel = detectedMode === 'staff'
    ? { tag: 'Staff Portal', color: 'text-violet-600 bg-violet-50 border-violet-200' }
    : detectedMode === 'student'
    ? { tag: 'Student Portal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
    : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5fe 50%, #f0fdf9 100%)' }}>
      
      {/* Decorative blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-[420px] z-10">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 flex flex-col items-center"
        >
          <motion.div
            whileHover={{ scale: 1.06, rotate: [-2, 2, -2, 0] }}
            transition={{ duration: 0.5 }}
            className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100 cursor-pointer mb-4"
          >
            <img
              src="/logo.png"
              alt="GEC Wayanad Logo"
              style={{ width: '68px', height: '68px', objectFit: 'contain' }}
              loading="eager"
            />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Hostel<span className="text-primary-600">Track</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1.5 tracking-wider uppercase">
            Government Engineering College, Wayanad
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/90 backdrop-blur-md rounded-[28px] border border-slate-200/60 p-8"
          style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1), 0 4px 16px -4px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Enter your email <span className="text-slate-400">or</span> roll number to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email / Roll Number
                </label>
                <AnimatePresence>
                  {modeLabel && (
                    <motion.span
                      key={modeLabel.tag}
                      initial={{ opacity: 0, scale: 0.8, x: 8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${modeLabel.color}`}
                    >
                      {modeLabel.tag}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <AnimatePresence mode="wait">
                  {detectedMode === 'student' ? (
                    <motion.div key="user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <User className="w-4 h-4 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="mail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail className={`w-4 h-4 ${detectedMode === 'staff' ? 'text-violet-500' : 'text-slate-400'}`} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  placeholder="admin@hostel.com  or  CST221"
                  className={`w-full bg-slate-50/60 border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 ${
                    detectedMode === 'staff'
                      ? 'border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 focus:bg-white'
                      : detectedMode === 'student'
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:bg-white uppercase'
                      : 'border-slate-200/80 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:bg-white'
                  }`}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/60 border border-slate-200/80 rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all font-medium text-slate-800"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hint for student login */}
            <AnimatePresence>
              {detectedMode === 'student' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <p className="text-[11px] text-emerald-700 font-semibold text-center">
                      🔑 Default password is your roll number in lowercase
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-white font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2 ${
                detectedMode === 'student'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                  : 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-violet-500/20'
              }`}
            >
              {loading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  <span>
                    {detectedMode === 'student' ? 'Enter Student Portal' : detectedMode === 'staff' ? 'Authenticate Staff' : 'Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Role guide */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-3">
              Recognised accounts
            </p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 p-2.5 bg-violet-50 rounded-xl border border-violet-100">
                <div className="h-6 w-6 bg-violet-500 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-violet-700 uppercase tracking-wide">Staff</p>
                  <p className="text-[9px] text-violet-500 font-medium">Use email address</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="h-6 w-6 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">Student</p>
                  <p className="text-[9px] text-emerald-500 font-medium">Use roll number</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6 text-[11px] text-slate-400 font-medium"
        >
          Hostel Attendance System · GEC Wayanad · © {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  );
}
