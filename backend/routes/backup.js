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
// Get current backup configuration
router.get('/config', async (req, res) => {
  try {
    const config = await getConfig();

    let oauthCredentials = null;
    if (config.oauthCredentials) {
      oauthCredentials = {
        client_id: config.oauthCredentials.client_id || null,
        client_secret: config.oauthCredentials.client_secret || null,
        configured: !!(config.oauthTokens && config.oauthTokens.refresh_token),
      };
    }

    res.json({
      enabled: config.enabled,
      oauthCredentials,
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
router.put('/config', async (req, res) => {
  try {
    const { enabled, driveFolderId, oauthCredentials } = req.body;
    const config = await getConfig();

    if (enabled !== undefined) config.enabled = enabled;

    if (oauthCredentials !== undefined) {
      if (oauthCredentials === null) {
        config.oauthCredentials = null;
      } else {
        const existing = config.oauthCredentials || {};
        config.oauthCredentials = {
          client_id: oauthCredentials.client_id !== undefined ? oauthCredentials.client_id : existing.client_id,
          client_secret: oauthCredentials.client_secret ? oauthCredentials.client_secret : existing.client_secret,
          redirect_uri: oauthCredentials.redirect_uri || existing.redirect_uri,
        };
      }
      config.markModified('oauthCredentials');
    }

    if (driveFolderId !== undefined) {
      // Strip trailing dots, slashes, whitespace that may come from copy-pasting URLs
      config.driveFolderId = driveFolderId ? driveFolderId.replace(/[\s./]+$/, '').trim() : null;
    }

    config.updatedAt = new Date();
    await config.save();

    let responseOauth = null;
    if (config.oauthCredentials) {
      responseOauth = {
        client_id: config.oauthCredentials.client_id || null,
        client_secret: config.oauthCredentials.client_secret || null,
        configured: !!(config.oauthTokens && config.oauthTokens.refresh_token),
      };
    }

    res.json({
      message: 'Backup configuration updated',
      enabled: config.enabled,
      oauthCredentials: responseOauth,
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

// --------------- GET /api/backup/oauth/url ---------------
// Generate Google OAuth URL
router.get('/oauth/url', async (req, res) => {
  try {
    const { getAuthUrl } = require('../services/backupService');
    // The redirect URI should be the frontend admin page exactly without query params
    // If req.headers.referer is present, use it, stripping query params.
    let redirectUri = req.query.redirectUri;
    if (!redirectUri && req.headers.referer) {
      const url = new URL(req.headers.referer);
      redirectUri = url.origin + url.pathname;
    }
    const authUrl = await getAuthUrl(redirectUri);
    res.json({ url: authUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------- POST /api/backup/oauth/callback ---------------
// Handle OAuth callback code
router.post('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }
    const { handleOAuthCallback } = require('../services/backupService');
    const result = await handleOAuthCallback(code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
