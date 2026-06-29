import api from './axios';

// ── Simple in-memory cache for rooms list ──
// Rooms rarely change; caching avoids redundant API calls on every page load
let _roomsCache = null;
let _roomsCacheTime = 0;
const ROOMS_CACHE_TTL = 60_000; // 1 minute

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

export const getRooms = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && _roomsCache && (now - _roomsCacheTime) < ROOMS_CACHE_TTL) {
    return _roomsCache;
  }
  const { data } = await api.get('/api/students/rooms');
  _roomsCache = data;
  _roomsCacheTime = now;
  return data;
};

// Invalidate rooms cache (call after adding/editing students that change rooms)
export const invalidateRoomsCache = () => {
  _roomsCache = null;
  _roomsCacheTime = 0;
};

export const createStudent = async (studentData) => {
  invalidateRoomsCache();
  const { data } = await api.post('/api/students', studentData);
  return data;
};

export const updateStudent = async (id, studentData) => {
  invalidateRoomsCache();
  const { data } = await api.put(`/api/students/${id}`, studentData);
  return data;
};

export const deactivateStudent = async (id) => {
  invalidateRoomsCache();
  const { data } = await api.delete(`/api/students/${id}`);
  return data;
};

export const reactivateStudent = async (id) => {
  invalidateRoomsCache();
  const { data } = await api.patch(`/api/students/${id}/reactivate`);
  return data;
};

export const deleteStudent = async (id) => {
  invalidateRoomsCache();
  const { data } = await api.delete(`/api/students/${id}?hard=true`);
  return data;
};
