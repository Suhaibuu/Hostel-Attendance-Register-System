import api from './axios';

export const markAttendance = async (data) => {
  const { data: result } = await api.post('/api/attendance/mark', data);
  return result;
};

export const getTodayAttendance = async (roomNo) => {
  const { data } = await api.get(`/api/attendance/today/${roomNo}`);
  return data;
};

export const getStudentAttendance = async (studentId, month) => {
  const { data } = await api.get(`/api/attendance/student/${studentId}`, {
    params: month ? { month } : {},
  });
  return data;
};

export const getReport = async (month) => {
  const { data } = await api.get('/api/attendance/report', {
    params: month ? { month } : {},
  });
  return data;
};
