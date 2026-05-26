const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  printHTML: (html) => ipcRenderer.invoke('print-html', html),
  downloadFile: (url, filename) => ipcRenderer.invoke('download-file', url, filename),
  backupAndQuit: (excelUrl) => ipcRenderer.invoke('backup-and-quit', excelUrl),
  forceQuit: () => ipcRenderer.invoke('force-quit'),
  onBeforeClose: (cb) => ipcRenderer.on('before-close', cb),
  // Otomatik yedek
  listAutoBackups: () => ipcRenderer.invoke('list-auto-backups'),
  downloadAutoBackup: (filename) => ipcRenderer.invoke('download-auto-backup', filename),
  deleteAutoBackup: (filename) => ipcRenderer.invoke('delete-auto-backup', filename),
  getAutoBackupDir: () => ipcRenderer.invoke('get-auto-backup-dir')
});
