const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let splashWindow;
let server;
const PORT = 4500;

function waitForServer(cb, tries = 0) {
  http.get(`http://127.0.0.1:${PORT}/api/organizasyonlar`, () => cb())
    .on('error', () => {
      if (tries < 40) setTimeout(() => waitForServer(cb, tries + 1), 300);
    });
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 520, height: 340,
    frame: false, transparent: true,
    resizable: false, center: true,
    alwaysOnTop: true, skipTaskbar: true,
    icon: path.join(__dirname, 'assets', 'defterdar.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  splashWindow.loadFile(path.join(__dirname, 'public', 'splash.html'));
}

function createMain() {
  mainWindow = new BrowserWindow({
    width: 1360, height: 860,
    minWidth: 1024, minHeight: 680,
    show: false,
    icon: path.join(__dirname, 'assets', 'defterdar.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Defterdar Muhasebe'
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
      mainWindow.show();
      mainWindow.focus();
    }, 2000);
  });

  // Kapatma öncesi yedek sor
  let isQuitting = false;
  mainWindow.on('close', (e) => {
    if (isQuitting) return; // force-quit sonrası tekrar tetiklenmesin
    e.preventDefault();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('before-close');
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── IPC: HTML yazdır
ipcMain.handle('print-html', async (event, html) => {
  const os = require('os');
  const tmpFile = path.join(os.tmpdir(), 'defterdar-print-' + Date.now() + '.html');
  fs.writeFileSync(tmpFile, html, 'utf8');

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  await printWin.loadFile(tmpFile);

  return new Promise((resolve) => {
    printWin.webContents.print({ silent: false, printBackground: true }, (success) => {
      printWin.close();
      try { fs.unlinkSync(tmpFile); } catch(e) {}
      resolve({ ok: success });
    });
  });
});

// ── IPC: Excel indir (net modülü ile)
ipcMain.handle('download-file', async (event, url, filename) => {
  try {
    const { net } = require('electron');
    const buf = await new Promise((resolve, reject) => {
      const req = net.request(url);
      const chunks = [];
      req.on('response', (res) => {
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode));
          return;
        }
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [{ name: 'Excel Dosyasi', extensions: ['xlsx'] }]
    });
    if (canceled || !filePath) return { ok: false };
    fs.writeFileSync(filePath, buf);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Yedek al ve kaydet
ipcMain.handle('backup-and-quit', async (event, excelUrl) => {
  try {
    const { net } = require('electron');
    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = 'defterdar-yedek-' + tarih + '.xlsx';

    const buf = await new Promise((resolve, reject) => {
      const req = net.request(excelUrl);
      const chunks = [];
      req.on('response', (res) => {
        if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      title: 'Yedek Dosyasini Kaydet',
      filters: [{ name: 'Excel Yedek', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) return { ok: false, canceled: true };
    fs.writeFileSync(filePath, buf);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Zorla kapat (yedek sonrası)
ipcMain.handle('force-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // close event'i bypass et
    mainWindow.removeAllListeners('close');
  }
  if (server) server.close();
  app.quit();
});

app.whenReady().then(() => {
  // Windows güvenlik duvarı kuralı ekle (sessizce)
  try {
    const { execSync } = require('child_process');
    execSync('netsh advfirewall firewall add rule name="Defterdar Muhasebe 4500" dir=in action=allow protocol=TCP localport=4500', { stdio: 'ignore' });
  } catch(e) {}

  createSplash();
  const expressApp = require('./server');
  server = http.createServer(expressApp);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') waitForServer(() => createMain());
  });
  server.on('listening', () => waitForServer(() => createMain()));
  server.listen(PORT, '0.0.0.0');
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
