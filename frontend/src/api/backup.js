import api from './axios';

export const getBackupConfig = async () => {
  const { data } = await api.get('/api/backup/config');
  return data;
};

export const updateBackupConfig = async (configData) => {
  const { data } = await api.put('/api/backup/config', configData);
  return data;
};

export const testBackupConnection = async () => {
  const { data } = await api.post('/api/backup/test');
  return data;
};

export const triggerBackup = async () => {
  const { data } = await api.post('/api/backup/trigger');
  return data;
};

export const backfillMissingDates = async () => {
  const { data } = await api.post('/api/backup/backfill');
  return data;
};

export const createDriveFolder = async () => {
  const { data } = await api.post('/api/backup/create-folder');
  return data;
};

export const getOAuthUrl = async (redirectUri) => {
  const { data } = await api.get('/api/backup/oauth/url', {
    params: { redirectUri }
  });
  return data;
};

export const handleOAuthCallback = async (code) => {
  const { data } = await api.post('/api/backup/oauth/callback', { code });
  return data;
};
