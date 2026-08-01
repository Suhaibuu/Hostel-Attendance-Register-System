import { useState, useEffect } from 'react';
import {
  getBackupConfig,
  updateBackupConfig,
  testBackupConnection,
  triggerBackup,
  backfillMissingDates,
} from '../../api/backup';
import {
  HardDrive, Cloud, CheckCircle, XCircle, RefreshCw, Upload,
  Shield, Folder, Key, AlertTriangle, Wifi, Play, Trash2,
} from 'lucide-react';

export default function BackupSettingsTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [triggerResult, setTriggerResult] = useState(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [folderId, setFolderId] = useState('');
  const [serviceJsonText, setServiceJsonText] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await getBackupConfig();
      setConfig(data);
      setEnabled(data.enabled);
      setFolderId(data.driveFolderId || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
    setTestResult(null);
    setTriggerResult(null);
    setBackfillResult(null);
  };

  const handleSave = async () => {
    clearMessages();
    setSaving(true);
    try {
      const payload = {
        enabled,
        driveFolderId: folderId || null,
      };

      // Only include serviceAccountJson if the user entered new credentials
      if (serviceJsonText.trim()) {
        try {
          payload.serviceAccountJson = JSON.parse(serviceJsonText);
        } catch {
          setError('Invalid JSON format for service account credentials');
          setSaving(false);
          return;
        }
      }

      const result = await updateBackupConfig(payload);
      setSuccessMsg(result.message || 'Configuration saved');
      setServiceJsonText('');
      setShowJsonInput(false);
      await fetchConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    clearMessages();
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testBackupConnection();
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleTrigger = async () => {
    clearMessages();
    setTriggering(true);
    setTriggerResult(null);
    try {
      const result = await triggerBackup();
      setTriggerResult(result);
      await fetchConfig(); // Refresh to get new lastBackup info
    } catch (err) {
      setTriggerResult({ status: 'failed', error: err.message });
    } finally {
      setTriggering(false);
    }
  };

  const handleRemoveCredentials = async () => {
    clearMessages();
    setSaving(true);
    try {
      await updateBackupConfig({ serviceAccountJson: null, enabled: false });
      setSuccessMsg('Credentials removed and backup disabled');
      setEnabled(false);
      await fetchConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-slate-500 font-semibold tracking-wide">Loading backup settings...</p>
      </div>
    );
  }

  const isConfigured = config?.serviceAccount?.configured;
  const lastBackup = config?.lastBackup;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-premium">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Google Drive Backup</h3>
            <p className="text-xs text-slate-400 font-semibold">Automatic daily backups to your Google Drive</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fade-in">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Error</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Connection Status + Last Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-premium">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connection Status</h4>
          </div>
          {isConfigured ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-emerald-700">Credentials Configured</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Service Account</p>
                <p className="text-xs text-slate-700 font-mono break-all">{config.serviceAccount.client_email}</p>
                <p className="text-[10px] text-slate-400 mt-1">Project: {config.serviceAccount.project_id}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
              <span className="text-sm font-bold text-amber-600">Not Configured</span>
            </div>
          )}
        </div>

        {/* Last Backup */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-premium">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Backup</h4>
          </div>
          {lastBackup?.timestamp ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  lastBackup.status === 'success' ? 'bg-emerald-500' :
                  lastBackup.status === 'failed' ? 'bg-red-500' :
                  lastBackup.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                  'bg-slate-300'
                }`} />
                <span className={`text-sm font-bold capitalize ${
                  lastBackup.status === 'success' ? 'text-emerald-700' :
                  lastBackup.status === 'failed' ? 'text-red-700' :
                  'text-blue-700'
                }`}>{lastBackup.status || 'Unknown'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                {lastBackup.fileName && (
                  <p className="text-xs text-slate-700 font-medium">{lastBackup.fileName}</p>
                )}
                <p className="text-[11px] text-slate-400">
                  {new Date(lastBackup.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
                {lastBackup.error && (
                  <p className="text-xs text-red-500 mt-1">{lastBackup.error}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
              <span className="text-sm text-slate-500 font-medium">No backups yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-premium space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</h4>
        </div>

        {/* Enable / Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
          <div>
            <p className="text-sm font-bold text-slate-800">Auto Backup</p>
            <p className="text-xs text-slate-400 mt-0.5">Automatically backup after attendance is marked</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-smooth cursor-pointer ${
              enabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-smooth ${
              enabled ? 'left-6.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Service Account JSON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Service Account Credentials
              </label>
            </div>
            <div className="flex gap-2">
              {isConfigured && (
                <button
                  onClick={handleRemoveCredentials}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200/60 transition-smooth cursor-pointer uppercase tracking-wider disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
              <button
                onClick={() => setShowJsonInput(!showJsonInput)}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200/60 transition-smooth cursor-pointer uppercase tracking-wider"
              >
                <Upload className="w-3 h-3" />
                {isConfigured ? 'Update' : 'Add'} Credentials
              </button>
            </div>
          </div>

          {showJsonInput && (
            <div className="animate-fade-in space-y-2">
              <textarea
                value={serviceJsonText}
                onChange={(e) => setServiceJsonText(e.target.value)}
                rows={8}
                placeholder='Paste your Google service account JSON here...'
                className="w-full p-4 text-xs font-mono bg-slate-900 text-emerald-400 rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/50">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  The JSON file is downloaded from Google Cloud Console → IAM & Admin → Service Accounts → Keys.
                  Make sure to share your Drive folder with the service account email as <strong>Editor</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Folder ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Google Drive Folder ID
            </label>
          </div>
          <input
            type="text"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            placeholder="e.g. 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
          />
          <p className="text-[10px] text-slate-400 ml-1">
            The folder ID is the last part of the folder URL: drive.google.com/drive/folders/<strong>THIS_PART</strong>
          </p>
        </div>



        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-smooth cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-glow"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Test Connection */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-premium space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Connection</h4>
          <p className="text-xs text-slate-500">Verify your credentials and folder access</p>
          <button
            onClick={handleTest}
            disabled={testing || !isConfigured}
            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-blue-200/60 transition-smooth cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {testing ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</>
            ) : (
              <><Wifi className="w-3.5 h-3.5" /> Test Connection</>
            )}
          </button>
          {testResult && (
            <div className={`p-3 rounded-xl text-xs font-medium animate-fade-in ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                : 'bg-red-50 text-red-700 border border-red-200/50'
            }`}>
              {testResult.success ? '✅ Connection successful!' : `❌ ${testResult.error}`}
            </div>
          )}
        </div>

        {/* Manual Trigger */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-premium space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manual Backup</h4>
          <p className="text-xs text-slate-500">Trigger a backup for today now</p>
          <button
            onClick={handleTrigger}
            disabled={triggering || !isConfigured || !enabled}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-emerald-200/60 transition-smooth cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {triggering ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Backing up...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Backup Now</>
            )}
          </button>
          {triggerResult && (
            <div className={`p-3 rounded-xl text-xs font-medium animate-fade-in ${
              triggerResult.status === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                : 'bg-red-50 text-red-700 border border-red-200/50'
            }`}>
              {triggerResult.status === 'success'
                ? `✅ Backup created: ${triggerResult.fileName}`
                : `❌ ${triggerResult.error || triggerResult.reason || 'Backup failed'}`
              }
            </div>
          )}
        </div>

        {/* Backfill Missing Dates */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-premium space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Backfill Missing</h4>
          <p className="text-xs text-slate-500">Create backups for all dates not yet on Drive</p>
          <button
            onClick={async () => {
              clearMessages();
              setBackfilling(true);
              setBackfillResult(null);
              try {
                const result = await backfillMissingDates();
                setBackfillResult(result);
              } catch (err) {
                setBackfillResult({ status: 'failed', error: err.message });
              } finally {
                setBackfilling(false);
              }
            }}
            disabled={backfilling || !isConfigured || !enabled}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-amber-200/60 transition-smooth cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {backfilling ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Backfilling...</>
            ) : (
              <><HardDrive className="w-3.5 h-3.5" /> Backfill All</>
            )}
          </button>
          {backfillResult && (
            <div className={`p-3 rounded-xl text-xs font-medium animate-fade-in ${
              backfillResult.status === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                : 'bg-red-50 text-red-700 border border-red-200/50'
            }`}>
              {backfillResult.status === 'success'
                ? `✅ ${backfillResult.message}`
                : `❌ ${backfillResult.error || 'Backfill failed'}`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
