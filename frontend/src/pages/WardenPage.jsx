import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms } from '../api/students';
import { getTodayAttendance, markAttendance } from '../api/attendance';
import PageWrapper from '../components/layout/PageWrapper';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

// ── Helpers ──────────────────────────────────────────────

const formatDate = () => {
  const d = new Date();
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const avatarColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
];

const getAvatarColor = (name) => {
  const code = (name || 'A').charCodeAt(0);
  return avatarColors[code % avatarColors.length];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Component ────────────────────────────────────────────

export default function WardenPage() {
  const { user, logout } = useAuth();

  // Room data
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Attendance data for selected room
  const [students, setStudents] = useState([]);         // [{ studentId, name, rollNo, present }]
  const [marks, setMarks] = useState({});               // { studentId: true | false | null }
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submittedRooms, setSubmittedRooms] = useState(new Set());

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Fetch rooms on mount ──
  useEffect(() => {
    (async () => {
      try {
        const data = await getRooms();
        setRooms(data.rooms || []);
      } catch {
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    })();
  }, []);

  // ── Fetch attendance when room changes ──
  const loadRoom = useCallback(async (roomNo) => {
    setSelectedRoom(roomNo);
    setStudentsLoading(true);
    try {
      const data = await getTodayAttendance(roomNo);
      setStudents(data.students || []);
      const initial = {};
      (data.students || []).forEach((s) => {
        initial[s.studentId] = s.present; // true, false, or null
      });
      setMarks(initial);

      // If every student already has a value, consider this room submitted
      const allMarked = (data.students || []).every((s) => s.present !== null);
      if (allMarked && (data.students || []).length > 0) {
        setSubmittedRooms((prev) => new Set(prev).add(roomNo));
      }
    } catch {
      setStudents([]);
      setMarks({});
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // ── Mark a student ──
  const toggleMark = (studentId, value) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  // ── Mark all present ──
  const markAllPresent = () => {
    const updated = {};
    students.forEach((s) => { updated[s.studentId] = true; });
    setMarks(updated);
  };

  // ── Submit ──
  const markedCount = Object.values(marks).filter((v) => v !== null).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(marks)
        .filter(([, v]) => v !== null)
        .map(([studentId, present]) => ({ studentId, present }));

      await markAttendance({ roomNo: selectedRoom, date: todayISO(), records });
      setSubmittedRooms((prev) => new Set(prev).add(selectedRoom));
      setToast({ message: `✓ Attendance saved for Room ${selectedRoom}`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to submit attendance', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Room status dot ──
  const roomDot = (roomNo) => {
    if (submittedRooms.has(roomNo)) return 'bg-emerald-400';
    if (roomNo === selectedRoom) return 'bg-amber-400';
    return 'bg-slate-300';
  };

  // ── Render ──
  return (
    <PageWrapper>
      <TopBar
        title="HostelTrack"
        subtitle={formatDate()}
        rightContent={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        }
      />

      <main className="flex-1 px-4 py-5 pb-28 space-y-5">
        {/* ── Section 1: Room Selector ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-2.5">Select Room</h2>

          {roomsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
              <Spinner size="sm" /> Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No rooms found</p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {rooms.map((r) => (
                <button
                  key={r}
                  onClick={() => loadRoom(r)}
                  className={[
                    'relative rounded-xl border py-3 font-bold text-sm transition-all duration-200 cursor-pointer',
                    'active:scale-95 focus:outline-none',
                    r === selectedRoom
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                >
                  {r}
                  <span
                    className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${roomDot(r)}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: Student List ── */}
        {selectedRoom && (
          <div>
            {studentsLoading ? (
              <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
                <Spinner size="md" /> Loading students...
              </div>
            ) : students.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-400 text-center">
                  No active students in Room {selectedRoom}
                </p>
              </Card>
            ) : (
              <>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Room {selectedRoom}
                    </h3>
                    <Badge variant="info">{students.length} students</Badge>
                  </div>
                  <Button variant="success" size="sm" onClick={markAllPresent}>
                    ✓ All Present
                  </Button>
                </div>

                {/* Student cards */}
                <div className="space-y-2.5">
                  {students.map((s) => {
                    const status = marks[s.studentId];
                    const rowBg =
                      status === true
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : status === false
                          ? 'bg-red-50/60 border-red-200'
                          : 'bg-white border-slate-200';

                    return (
                      <div
                        key={s.studentId}
                        className={[
                          'flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200',
                          rowBg,
                        ].join(' ')}
                      >
                        {/* Avatar */}
                        <div
                          className={[
                            'shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                            'text-white text-sm font-bold',
                            getAvatarColor(s.name),
                          ].join(' ')}
                        >
                          {getInitials(s.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500">{s.rollNo}</p>
                        </div>

                        {/* Present / Absent pills */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleMark(s.studentId, true)}
                            className={[
                              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer',
                              'active:scale-95 focus:outline-none',
                              status === true
                                ? 'bg-[var(--color-success)] text-white'
                                : 'bg-transparent border border-emerald-300 text-emerald-600',
                            ].join(' ')}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => toggleMark(s.studentId, false)}
                            className={[
                              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer',
                              'active:scale-95 focus:outline-none',
                              status === false
                                ? 'bg-[var(--color-danger)] text-white'
                                : 'bg-transparent border border-red-300 text-red-500',
                            ].join(' ')}
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Section 3: Sticky Submit Bar ── */}
      {selectedRoom && students.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40
                     bg-white/95 backdrop-blur border-t border-[var(--color-border)]
                     shadow-[0_-4px_12px_rgba(0,0,0,0.05)]
                     flex items-center justify-between px-4 py-3"
        >
          <span className="text-sm text-slate-500">
            {markedCount} of {students.length} marked
          </span>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={markedCount === 0}
            loading={submitting}
          >
            Submit Attendance
          </Button>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageWrapper>
  );
}
