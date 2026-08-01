const express = require('express');
const { protect } = require('../middleware/auth');
const BackupConfig = require('../models/BackupConfig');
const { getConfig, performBackup, testConnection, backfillMissingDates, createDriveFolder } = require('../services/backupService');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Admin-only middleware ──
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

router.use(adminOnly);

// --------------- GET /api/backup/config ---------------
// Get current backup configuration (credentials are masked)
router.get('/config', async (req, res) => {
  try {
    const config = await getConfig();

    // Mask service account details — only show email and project
    let serviceAccountInfo = null;
    if (config.serviceAccountJson) {
      serviceAccountInfo = {
        client_email: config.serviceAccountJson.client_email || null,
        project_id: config.serviceAccountJson.project_id || null,
        configured: true,
      };
    }

    res.json({
      enabled: config.enabled,
      serviceAccount: serviceAccountInfo,
      driveFolderId: config.driveFolderId,
      lastBackup: config.lastBackup,
      updatedAt: config.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- PUT /api/backup/config ---------------
// Update backup configuration
// Body: { enabled?, serviceAccountJson?, driveFolderId? }
router.put('/config', async (req, res) => {
  try {
    const { enabled, serviceAccountJson, driveFolderId } = req.body;
    const config = await getConfig();

    if (enabled !== undefined) config.enabled = enabled;

    if (serviceAccountJson !== undefined) {
      // Validate it looks like a service account JSON
      if (serviceAccountJson && typeof serviceAccountJson === 'object') {
        if (!serviceAccountJson.client_email || !serviceAccountJson.private_key) {
          return res.status(400).json({
            message: 'Invalid service account JSON. Must contain client_email and private_key.',
          });
        }
        config.serviceAccountJson = serviceAccountJson;
      } else if (serviceAccountJson === null) {
        config.serviceAccountJson = null;
      }
    }

    if (driveFolderId !== undefined) {
      // Strip trailing dots, slashes, whitespace that may come from copy-pasting URLs
      config.driveFolderId = driveFolderId ? driveFolderId.replace(/[\s./]+$/, '').trim() : null;
    }

    config.updatedAt = new Date();
    await config.save();

    // Return masked response
    let serviceAccountInfo = null;
    if (config.serviceAccountJson) {
      serviceAccountInfo = {
        client_email: config.serviceAccountJson.client_email,
        project_id: config.serviceAccountJson.project_id,
        configured: true,
      };
    }

    res.json({
      message: 'Backup configuration updated',
      enabled: config.enabled,
      serviceAccount: serviceAccountInfo,
      driveFolderId: config.driveFolderId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- POST /api/backup/test ---------------
// Test Google Drive connection with stored credentials
router.post('/test', async (req, res) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------- POST /api/backup/trigger ---------------
// Manually trigger a backup (bypasses debounce)
router.post('/trigger', async (req, res) => {
  try {
    const result = await performBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
});

// --------------- POST /api/backup/backfill ---------------
// Create backups for all attendance dates that don't have one on Drive
router.post('/backfill', async (req, res) => {
  try {
    const result = await backfillMissingDates();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
});

// --------------- POST /api/backup/create-folder ---------------
// Create a "HostelTrack Backups" folder on Google Drive
router.post('/create-folder', async (req, res) => {
  try {
    const result = await createDriveFolder();
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
