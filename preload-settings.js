const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  selectAvatar: (state) => ipcRenderer.invoke('select-avatar', state),
  onSettingsUpdated: (callback) => {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('settings-updated', (event, settings) => {
      callback(settings);
    });
  },
});

