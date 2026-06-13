import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, GraduationCap, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Handcrafted fluid background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-50/40 blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-[440px] z-10">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 flex flex-col items-center"
        >
          <div className="relative mb-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="p-3 bg-white rounded-2xl shadow-premium border border-slate-100/80 cursor-pointer"
            >
              <img 
                src="/logo.png" 
                alt="GEC Wayanad Logo" 
                style={{ width: '68px', height: '68px', objectFit: 'contain' }} 
                className="shrink-0" 
              />
            </motion.div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Hostel<span className="text-primary-600"> Attendance</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1.5 tracking-wider uppercase">
            Government Engineering College, Wayanad
          </p>
        </motion.div>

        {/* Login Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/80 backdrop-blur-md rounded-[28px] shadow-premium border border-slate-200/50 overflow-hidden"
        >
          {/* Custom Animated Tab Bar */}
          <div className="flex p-2 bg-slate-100/60 m-3 rounded-2xl border border-slate-200/20 relative">
            <button
              onClick={() => { setTab('staff'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-smooth relative z-10 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'staff' ? 'text-primary-900' : 'text-slate-500'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Staff Login</span>
              {tab === 'staff' && (
                <motion.div 
                  layoutId="activeTabBg" 
                  className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1] border border-slate-100" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => { setTab('student'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-smooth relative z-10 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'student' ? 'text-primary-900' : 'text-slate-500'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
              {tab === 'student' && (
                <motion.div 
                  layoutId="activeTabBg" 
                  className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1] border border-slate-100" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Form Content Wrapper */}
          <div className="p-6 pt-3">
            <AnimatePresence mode="wait">
              {tab === 'staff' ? (
                <motion.form
                  key="staff-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleStaffLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@hostel.com"
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all font-medium text-slate-800"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Secret Key / Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all font-medium text-slate-800"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <>
                        <span>Authenticate Staff</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="student-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleStudentLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">College ID (Roll No)</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                        placeholder="CST221"
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800 uppercase"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Portal Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={stuPassword}
                        onChange={(e) => setStuPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/40 border border-emerald-100/30 rounded-xl">
                    <p className="text-[11px] text-emerald-700/80 font-medium text-center">
                      🔑 Initial login password is your roll number in lowercase
                    </p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <>
                        <span>Enter Student Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mt-6 text-xs text-slate-400 font-medium"
        >
          Hostel Attendance System · GEC Wayanad · © {new Date().getFullYear()}
        </motion.div>
      </div>
    </div>
  );
}
