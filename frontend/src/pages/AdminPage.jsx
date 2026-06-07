import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/layout/PageWrapper';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import StudentsTab from '../components/admin/StudentsTab';
import AttendanceTab from '../components/admin/AttendanceTab';

const tabs = [
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'attendance', label: 'Attendance', icon: '📋' },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('students');

  return (
    <PageWrapper>
      <TopBar
        title="HostelTrack Admin"
        subtitle="Dashboard"
        rightContent={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                activeTab === t.id
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800',
              ].join(' ')}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
      </main>
    </PageWrapper>
  );
}
