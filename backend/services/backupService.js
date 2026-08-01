const { google } = require('googleapis');
const { Readable } = require('stream');
const BackupConfig = require('../models/BackupConfig');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ─── In-memory debounce state ───
let _debounceTimer = null;
let _backupInProgress = false;

/**
 * Get the singleton backup config from DB.
 * Creates one with defaults if it doesn't exist.
 */
async function getConfig() {
  let config = await BackupConfig.findOne({ configKey: 'primary' });
  if (!config) {
    config = await BackupConfig.create({ configKey: 'primary' });
  }
  return config;
}

/**
 * Build an authenticated Google Drive client from stored service account JSON.
 */
function buildDriveClient(serviceAccountJson) {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountJson,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

/**
 * Today's date as YYYY-MM-DD (IST timezone — India).
 */
function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Export all collections to a single JSON object.
 */
async function exportAllData() {
  const [students, attendance, users] = await Promise.all([
    Student.find({}).lean(),
    Attendance.find({}).lean(),
    User.find({}, { passwordHash: 0 }).lean(), // Exclude password hashes from backup
  ]);

  return {
    exportedAt: new Date().toISOString(),
    date: todayIST(),
    collections: {
      students: { count: students.length, data: students },
      attendance: { count: attendance.length, data: attendance },
      users: { count: users.length, data: users },
    },
  };
}

/**
 * Delete the existing backup file for today (if any) from Google Drive.
 */
async function deleteTodayBackup(drive, config) {
  if (config.lastBackup?.driveFileId && config.lastBackup?.date === todayIST()) {
    try {
      await drive.files.delete({ fileId: config.lastBackup.driveFileId });
      console.log(`🗑️  Deleted previous backup: ${config.lastBackup.fileName}`);
    } catch (err) {
      // File may already be deleted or moved — not critical
      if (err.code !== 404) {
        console.warn('⚠️  Could not delete previous backup:', err.message);
      }
    }
  }
}

/**
 * Upload backup JSON to Google Drive.
 */
async function uploadToDrive(drive, folderId, jsonData, fileName) {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const stream = Readable.from([jsonString]);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    },
    media: {
      mimeType: 'application/json',
      body: stream,
    },
    fields: 'id, name, size',
  });

  return response.data;
}

/**
 * Perform the actual backup: export data → delete old → upload new.
 */
async function performBackup() {
  if (_backupInProgress) {
    console.log('⏳ Backup already in progress, skipping...');
    return { status: 'skipped', reason: 'already_in_progress' };
  }

  _backupInProgress = true;
  const config = await getConfig();

  // Pre-flight checks
  if (!config.enabled) {
    _backupInProgress = false;
    return { status: 'skipped', reason: 'disabled' };
  }
  if (!config.serviceAccountJson || !config.driveFolderId) {
    _backupInProgress = false;
    return { status: 'skipped', reason: 'not_configured' };
  }

  // Mark as in_progress
  config.lastBackup = {
    ...config.lastBackup,
    status: 'in_progress',
    error: null,
  };
  config.updatedAt = new Date();
  await config.save();

  try {
    const drive = buildDriveClient(config.serviceAccountJson);
    const today = todayIST();
    const fileName = `HostelTrack_Backup_${today}.json`;

    console.log(`📦 Starting backup for ${today}...`);

    // 1. Export all data
    const exportData = await exportAllData();

    // 2. Delete existing backup for today (if any)
    await deleteTodayBackup(drive, config);

    // 3. Upload new backup
    const uploaded = await uploadToDrive(drive, config.driveFolderId, exportData, fileName);

    // 4. Update config with success
    config.lastBackup = {
      date: today,
      driveFileId: uploaded.id,
      fileName: uploaded.name,
      timestamp: new Date(),
      status: 'success',
      error: null,
    };
    config.updatedAt = new Date();
    await config.save();

    console.log(`✅ Backup complete: ${uploaded.name} (ID: ${uploaded.id})`);
    _backupInProgress = false;
    return { status: 'success', fileId: uploaded.id, fileName: uploaded.name };

  } catch (err) {
    console.error('❌ Backup failed:', err.message);

    // Update config with failure
    config.lastBackup = {
      ...config.lastBackup,
      status: 'failed',
      error: err.message,
      timestamp: new Date(),
    };
    config.updatedAt = new Date();
    await config.save();

    _backupInProgress = false;
    return { status: 'failed', error: err.message };
  }
}

/**
 * Schedule a debounced backup.
 * Resets the timer on every call — backup fires only after 60 seconds
 * of inactivity (no new attendance marks).
 */
async function scheduleBackup() {
  // Clear any existing timer
  if (_debounceTimer) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }

  let config;
  try {
    config = await getConfig();
  } catch (err) {
    console.warn('⚠️  Could not read backup config:', err.message);
    return;
  }

  if (!config.enabled || !config.serviceAccountJson || !config.driveFolderId) {
    return; // Not configured — silently skip
  }

  const IDLE_MS = 60 * 1000; // 1 minute debounce

  console.log('⏱️  Backup scheduled — will trigger after 60s of idle time');

  _debounceTimer = setTimeout(async () => {
    _debounceTimer = null;
    try {
      await performBackup();
    } catch (err) {
      console.error('❌ Scheduled backup error:', err.message);
    }
  }, IDLE_MS);
}

/**
 * Test Drive connectivity with the stored credentials.
 */
async function testConnection() {
  const config = await getConfig();

  if (!config.serviceAccountJson || !config.driveFolderId) {
    return { success: false, error: 'Service account or folder ID not configured' };
  }

  try {
    const drive = buildDriveClient(config.serviceAccountJson);

    // Try to list files in the folder (just 1, to verify access)
    await drive.files.list({
      q: `'${config.driveFolderId}' in parents`,
      pageSize: 1,
      fields: 'files(id, name)',
    });

    return { success: true, message: 'Connection successful' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Backfill missing dates: find all attendance dates that don't have
 * a corresponding backup file on Google Drive, and create them.
 * Each backup is a full current DB snapshot named with that date.
 */
async function backfillMissingDates() {
  const config = await getConfig();

  if (!config.serviceAccountJson || !config.driveFolderId) {
    return { status: 'failed', error: 'Not configured' };
  }

  const drive = buildDriveClient(config.serviceAccountJson);

  // 1. Get all distinct attendance dates from DB
  const allDates = await Attendance.distinct('date');
  if (!allDates.length) {
    return { status: 'success', message: 'No attendance dates found', created: 0, skipped: 0 };
  }

  // 2. List all existing backup files on Drive
  let existingFiles = [];
  let pageToken = null;
  do {
    const res = await drive.files.list({
      q: `'${config.driveFolderId}' in parents and name contains 'HostelTrack_Backup_' and trashed = false`,
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name)',
      pageToken: pageToken || undefined,
    });
    existingFiles = existingFiles.concat(res.data.files || []);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  // Build a Set of dates that already have backups
  // File names are like: HostelTrack_Backup_2026-08-01.json
  const backedUpDates = new Set(
    existingFiles
      .map((f) => {
        const match = f.name.match(/HostelTrack_Backup_(\d{4}-\d{2}-\d{2})\.json/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
  );

  // 3. Find missing dates
  const missingDates = allDates.filter((d) => !backedUpDates.has(d)).sort();

  if (!missingDates.length) {
    return { status: 'success', message: 'All dates are already backed up', created: 0, skipped: allDates.length };
  }

  console.log(`📦 Backfilling ${missingDates.length} missing backup(s)...`);

  // 4. Export current data once (same snapshot for all files)
  const exportData = await exportAllData();

  let created = 0;
  const errors = [];

  for (const date of missingDates) {
    try {
      const fileName = `HostelTrack_Backup_${date}.json`;
      // Stamp the export with the correct date
      const dateExport = { ...exportData, date, backfilledAt: new Date().toISOString() };
      await uploadToDrive(drive, config.driveFolderId, dateExport, fileName);
      created++;
      console.log(`  ✅ ${fileName}`);
    } catch (err) {
      console.error(`  ❌ Failed for ${date}:`, err.message);
      errors.push({ date, error: err.message });
    }
  }

  const result = {
    status: errors.length === missingDates.length ? 'failed' : 'success',
    message: `Created ${created} backup(s), ${allDates.length - missingDates.length} already existed`,
    created,
    skipped: allDates.length - missingDates.length,
    total: allDates.length,
  };
  if (errors.length) result.errors = errors;

  console.log(`📦 Backfill complete: ${created}/${missingDates.length} created`);
  return result;
}

module.exports = {
  getConfig,
  scheduleBackup,
  performBackup,
  testConnection,
  backfillMissingDates,
};
