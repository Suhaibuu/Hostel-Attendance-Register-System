const mongoose = require('mongoose');

/**
 * Singleton config document for Google Drive backup settings.
 * Only one document should exist (enforced by configKey: 'primary').
 */
const backupConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    default: 'primary',
    unique: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  // Auth mode: 'service_account' or 'oauth2'
  authType: {
    type: String,
    enum: ['service_account', 'oauth2'],
    default: 'service_account',
  },
  // Google Service Account JSON credentials (stored as object)
  serviceAccountJson: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // OAuth 2.0 credentials (client_id, client_secret, redirect_uri)
  oauthCredentials: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // OAuth 2.0 tokens (access_token, refresh_token, etc.)
  oauthTokens: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Google Drive folder ID where backups will be stored
  driveFolderId: {
    type: String,
    default: null,
    trim: true,
  },
  // Last backup metadata
  lastBackup: {
    date: { type: String, default: null },       // YYYY-MM-DD
    driveFileId: { type: String, default: null }, // Google Drive file ID
    fileName: { type: String, default: null },
    timestamp: { type: Date, default: null },
    status: {
      type: String,
      enum: ['success', 'failed', 'in_progress', null],
      default: null,
    },
    error: { type: String, default: null },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('BackupConfig', backupConfigSchema);
