import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudents, getRooms } from '../../api/students';
import { getReport, getTodayStats } from '../../api/attendance';
import { 
  Activity, Users, Home, AlertTriangle, Clock, TrendingUp, CheckCircle, 
  XCircle, ChevronRight, Plus, Search, Calendar, RefreshCw, Sparkles, Map
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function ControlCenterTab() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, unmarked: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const studentData = await getStudents();
      const roomData = await getRooms();
      setStudents(studentData);
      setRooms(roomData.rooms || []);

      // Compute simple dashboard metrics
      const currentMonth = new Date().toISOString().slice(0, 7);
      const report = await getReport(currentMonth);

      // Get actual today's attendance stats from API
      try {
        const stats = await getTodayStats();
        setAttendanceStats({
          present: stats.present,
          absent: stats.absent,
          unmarked: stats.unmarked
        });
      } catch (statsErr) {
        console.error('Failed to load today stats:', statsErr);
        setAttendanceStats({ present: 0, absent: 0, unmarked: studentData.length });
      }

      // Generate a mock real-time student activity feed
      const actions = ['Checked In', 'Checked Out', 'Marked Present', 'Late Entry', 'Room Changed'];
      const feed = studentData.slice(0, 6).map((s, idx) => {
        const time = new Date();
        time.setMinutes(time.getMinutes() - idx * 24 - 15);
        return {
          id: s._id,
          student: s.name,
          rollNo: s.rollNo,
          roomNo: s.roomNo || 'Unallotted',
          action: actions[idx % actions.length],
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });
      setRecentLogs(feed);

    } catch (err) {
      console.error('Error loading Control Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalStudents = students.length;
  const occupiedRooms = rooms.length;
  const occupancyRate = totalStudents ? Math.round((students.filter(s => s.roomNo).length / (occupiedRooms * 4)) * 100) : 0;

  // Chart Data
  const chartData = [
    { name: 'Mon', attendance: 88 },
    { name: 'Tue', attendance: 92 },
    { name: 'Wed', attendance: 85 },
    { name: 'Thu', attendance: 94 },
    { name: 'Fri', attendance: 89 },
    { name: 'Sat', attendance: 95 },
    { name: 'Sun', attendance: 91 },
  ];

  const pieData = [
    { name: 'Present', value: attendanceStats.present, color: '#10b981' },
    { name: 'Absent', value: attendanceStats.absent, color: '#ef4444' },
    { name: 'Unmarked', value: attendanceStats.unmarked, color: '#f59e0b' },
  ];

  // Group rooms by floor (1xx = Floor 1, etc.)
  const getFloor = (roomNo) => {
    if (!roomNo) return 'Unallotted';
    const num = parseInt(roomNo.replace(/\D/g, ''));
    if (isNaN(num)) return 'Other';
    return `${Math.floor(num / 100)}F`;
  };

  const floors = rooms.reduce((acc, roomNo) => {
    const floor = getFloor(roomNo);
    if (!acc[floor]) acc[floor] = [];
    const occupants = students.filter(s => s.roomNo === roomNo && s.active);
    acc[floor].push({
      roomNo,
      studentCount: occupants.length,
      students: occupants
    });
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-slate-500 font-semibold tracking-wide">Syncing Control Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Panels */}
      <div>
        {/* Today's Check-Ins */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={50}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 font-sans">
                  {Math.round((attendanceStats.present / ((attendanceStats.present + attendanceStats.absent + attendanceStats.unmarked) || 1)) * 100)}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Present</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Check-Ins</h4>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hostel Roll-Call Status Overview</p>
            </div>
          </div>

          <div className="w-full md:w-auto md:min-w-[400px]">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-center border border-emerald-100/50">
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Present</p>
                <p className="text-xl font-black text-emerald-800 mt-1">{attendanceStats.present}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl text-center border border-red-100/50">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Absent</p>
                <p className="text-xl font-black text-red-800 mt-1">{attendanceStats.absent}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-center border border-amber-100/50">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Unmarked</p>
                <p className="text-xl font-black text-amber-800 mt-1">{attendanceStats.unmarked}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Occupancy Map */}
      <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-premium relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-primary-500" />
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Hostel Occupancy Map</h3>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <span className="w-2.5 h-2.5 bg-violet-500 rounded-full inline-block" /> Allotted
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <span className="w-2.5 h-2.5 bg-slate-200 rounded-full inline-block" /> Vacant
            </span>
          </div>
        </div>

        {/* Room Map Container */}
        <div className="space-y-6">
          {Object.entries(floors).map(([floor, floorRooms]) => (
            <div key={floor} className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider ml-1">{floor} Level</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {floorRooms.map((room) => {
                  const occupantsCount = room.studentCount;
                  const maxCapacity = 4; // Capacity of 4 students
                  const isFull = occupantsCount >= maxCapacity;
                  const isSelected = selectedRoom?.roomNo === room.roomNo;

                  return (
                    <motion.div
                      key={room.roomNo}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-3.5 rounded-2xl border transition-smooth cursor-pointer text-center relative ${
                        isSelected
                          ? 'bg-primary-50 border-primary-500 shadow-glow'
                          : isFull
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Home className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`} />
                      <h5 className="text-sm font-bold text-slate-800">{room.roomNo}</h5>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {occupantsCount}/{maxCapacity} Beds occupied
                      </p>
                      <div className="flex justify-center gap-1 mt-2">
                        {Array.from({ length: maxCapacity }).map((_, i) => (
                          <span 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full ${
                              i < occupantsCount 
                                ? 'bg-primary-500' 
                                : 'bg-slate-200'
                            }`} 
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Room Details Drawer */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Details</h4>
                  <p className="text-xl font-black text-slate-800">Room {selectedRoom.roomNo}</p>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-smooth cursor-pointer"
                >
                  Close Map Overlay
                </button>
              </div>

              {selectedRoom.students.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedRoom.students.map((student) => (
                    <div key={student._id || student.rollNo} className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{student.rollNo}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-0.5">
                        {student.department}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium italic">No students currently allotted to this room.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
