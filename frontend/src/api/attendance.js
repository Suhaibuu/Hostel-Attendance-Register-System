import api from './axios';

export const markAttendance = async (data) => {
  const { data: result } = await api.post('/api/attendance/mark', data);
  return result;
};

// Fetch attendance for a room on any date (today by default)
export const getRoomAttendance = async (roomNo, date) => {
  const params = date ? { date } : {};
  const { data } = await api.get(`/api/attendance/date/${roomNo}`, { params });
  return data;
};

// Legacy alias – still works (backend now delegates to same handler)
export const getTodayAttendance = async (roomNo) => getRoomAttendance(roomNo);

export const getStudentAttendance = async (studentId, month) => {
  const { data } = await api.get(`/api/attendance/student/${studentId}`, {
    params: month ? { month } : {},
  });
  return data;
};

export const getStudentMonths = async (studentId) => {
  const { data } = await api.get(`/api/attendance/student/${studentId}/months`);
  return data; // { months: ["2026-06", "2026-05", ...] }
};

export const getReport = async (month) => {
  const { data } = await api.get('/api/attendance/report', {
    params: month ? { month } : {},
  });
  return data;
};

export const getTodayStats = async () => {
  const { data } = await api.get('/api/attendance/stats/today');
  return data;
};
