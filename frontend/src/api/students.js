import api from './axios';

export const getStudents = async (params) => {
  const { data } = await api.get('/api/students', { params });
  return data;
};

export const getStudent = async (id) => {
  const { data } = await api.get(`/api/students/${id}`);
  return data;
};

export const getStudentsByRoom = async (roomNo) => {
  const { data } = await api.get(`/api/students/room/${roomNo}`);
  return data;
};

export const getRooms = async () => {
  const { data } = await api.get('/api/students/rooms');
  return data;
};

export const createStudent = async (studentData) => {
  const { data } = await api.post('/api/students', studentData);
  return data;
};

export const updateStudent = async (id, studentData) => {
  const { data } = await api.put(`/api/students/${id}`, studentData);
  return data;
};

export const deactivateStudent = async (id) => {
  const { data } = await api.delete(`/api/students/${id}`);
  return data;
};

export const deleteStudent = async (id) => {
  const { data } = await api.delete(`/api/students/${id}?hard=true`);
  return data;
};
