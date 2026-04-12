const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  printHTML: (html) => ipcRenderer.invoke('print-html', html),
  downloadFile: (url, filename) => ipcRenderer.invoke('download-file', url, filename),
  backupAndQuit: (excelUrl) => ipcRenderer.invoke('backup-and-quit', excelUrl),
  forceQuit: () => ipcRenderer.invoke('force-quit'),
  onBeforeClose: (cb) => ipcRenderer.on('before-close', cb)
});
