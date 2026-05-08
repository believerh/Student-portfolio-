import React, { useState } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const LMSSettingsModal = ({ onClose, onSave, connections = [] }) => {
  const [newConnection, setNewConnection] = useState({
    name: '',
    lms_type: 'moodle',
    base_url: '',
    api_token: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave(newConnection);
      setNewConnection({ name: '', lms_type: 'moodle', base_url: '', api_token: '' });
      onClose();
    } catch (error) {
      console.error('Failed to save LMS connection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async (connectionId) => {
    setSyncStatus({ connectionId, status: 'syncing' });
    // Would call sync function here
    setTimeout(() => {
      setSyncStatus({ connectionId, status: 'success' });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="lms-settings-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="lms-settings-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            LMS Integrations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close LMS settings"
          >
            ×
          </button>
        </div>

        {/* Existing Connections */}
        {connections.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Connected Systems
            </h3>
            <div className="space-y-3">
              {connections.map(conn => (
                <div key={conn.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{conn.name}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({conn.lms_type})</span>
                    </div>
                    <button
                      onClick={() => handleSync(conn.id)}
                      disabled={syncStatus?.connectionId === conn.id && syncStatus?.status === 'syncing'}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 disabled:opacity-50"
                      aria-label={`Sync assignments from ${conn.name}`}
                    >
                      <RefreshCw className={`w-4 h-4 ${syncStatus?.connectionId === conn.id && syncStatus?.status === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>
                  {syncStatus?.connectionId === conn.id && (
                    <div className={`mt-2 text-sm ${syncStatus.status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                      {syncStatus.status === 'success' ? 'Sync completed successfully' : 'Syncing...'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Connection */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Add New Connection
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Connection Name
              </label>
              <input
                id="name"
                type="text"
                value={newConnection.name}
                onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                placeholder="My Moodle"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-label="Connection name"
              />
            </div>

            <div>
              <label htmlFor="lms_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LMS Type
              </label>
              <select
                id="lms_type"
                value={newConnection.lms_type}
                onChange={(e) => setNewConnection({ ...newConnection, lms_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                aria-label="LMS type"
              >
                <option value="moodle">Moodle</option>
                <option value="canvas">Canvas</option>
                <option value="google">Google Classroom</option>
              </select>
            </div>

            <div>
              <label htmlFor="base_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LMS URL
              </label>
              <input
                id="base_url"
                type="url"
                value={newConnection.base_url}
                onChange={(e) => setNewConnection({ ...newConnection, base_url: e.target.value })}
                placeholder="https://moodle.example.edu"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-label="LMS base URL"
              />
            </div>

            <div>
              <label htmlFor="api_token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Token / Key
              </label>
              <input
                id="api_token"
                type="password"
                value={newConnection.api_token}
                onChange={(e) => setNewConnection({ ...newConnection, api_token: e.target.value })}
                placeholder="Enter API token"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-label="API token"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Save Connection</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LMSSettingsModal;