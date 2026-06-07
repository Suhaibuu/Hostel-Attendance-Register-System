import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/layout/PageWrapper';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import StudentsTab from '../components/admin/StudentsTab';
import AttendanceTab from '../components/admin/AttendanceTab';
import ControlCenterTab from '../components/admin/ControlCenterTab';
import { LayoutDashboard, Users, ClipboardCheck, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'overview', label: 'Control Center', icon: LayoutDashboard },
  { id: 'students', label: 'Students Directory', icon: Users },
  { id: 'attendance', label: 'Attendance Logs', icon: ClipboardCheck },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <PageWrapper>
      <TopBar
        title="HostelTrack Admin"
        subtitle="Operational Control Room"
        rightContent={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{user?.name || 'Administrator'}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hostel Admin</span>
            </div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-500 transition-smooth flex items-center gap-1.5 text-xs font-bold border border-slate-200/40 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Modern Sliding Navigation Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-200/60 m-0 rounded-2xl w-fit border border-slate-200/10">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-smooth relative cursor-pointer ${
                  isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
                {isSelected && (
                  <motion.div 
                    layoutId="adminTabBg" 
                    className="absolute inset-0 bg-primary-600 rounded-xl shadow-glow z-[-1]" 
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content panel wrapper with subtle motion reveal */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-[60vh]"
        >
          {activeTab === 'overview' && <ControlCenterTab />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'attendance' && <AttendanceTab />}
        </motion.div>
      </main>
    </PageWrapper>
  );
}
