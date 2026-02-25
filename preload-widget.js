const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  onSettingsUpdated: (callback) => {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('settings-updated', (event, settings) => {
      callback(settings);
    });
  },
  showWidgetMenu: () => ipcRenderer.invoke('show-widget-menu'),
  moveWindow: (position) => {
    ipcRenderer.send('move-widget', position);
  },
});

