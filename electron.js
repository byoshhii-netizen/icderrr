const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let splashWindow;
let server;
const PORT = 4500;

// ── OTOMATİK YEDEK KLASÖRÜ
function getAutoBackupDir() {
  try {
    const userDataPath = app.getPath('userData');
    const dir = path.join(userDataPath, 'otomatik-yedek');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch(e) {
    const dir = path.join(__dirname, 'otomatik-yedek');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}

// ── OTOMATİK YEDEK AL (ayara göre dinamik)
let _otoYedekInterval = null;

async function otoYedekAyarOku() {
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${PORT}/api/admin/otomatik-yedek-ayar`, (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    });
    if (res.status === 200) {
      const ayar = JSON.parse(res.data);
      return { aktif: ayar.aktif !== false, dakika: Math.max(1, parseInt(ayar.dakika) || 10) };
    }
  } catch(e) {}
  return { aktif: true, dakika: 10 }; // varsayılan
}

async function otoYedekBaslat() {
  const ayar = await otoYedekAyarOku();
  console.log(`[OTO-YEDEK] Ayar: aktif=${ayar.aktif}, dakika=${ayar.dakika}`);

  if (_otoYedekInterval) {
    clearInterval(_otoYedekInterval);
    _otoYedekInterval = null;
  }

  if (!ayar.aktif) {
    console.log('[OTO-YEDEK] Kapalı, çalışmıyor.');
    return;
  }

  const ms = ayar.dakika * 60 * 1000;
  otomatikYedekAl(); // İlk yedek hemen
  _otoYedekInterval = setInterval(otomatikYedekAl, ms);
  console.log(`[OTO-YEDEK] Her ${ayar.dakika} dakikada bir çalışacak.`);
}

async function otomatikYedekAl() {
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${PORT}/api/admin/yedek-al-internal`, (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    });

    if (res.status !== 200) return;

    const dir = getAutoBackupDir();
    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dosyaAdi = `oto-yedek-${tarih}.json`;
    fs.writeFileSync(path.join(dir, dosyaAdi), res.data, 'utf8');

    // Son 20 yedeği tut, eskilerini sil
    const dosyalar = fs.readdirSync(dir)
      .filter(f => f.startsWith('oto-yedek-') && f.endsWith('.json'))
      .sort()
      .reverse();
    if (dosyalar.length > 20) {
      dosyalar.slice(20).forEach(f => {
        try { fs.unlinkSync(path.join(dir, f)); } catch(e) {}
      });
    }
    console.log(`[OTO-YEDEK] Kaydedildi: ${dosyaAdi}`);
  } catch(e) {
    console.error('[OTO-YEDEK] Hata:', e.message);
  }
}

// ── IPC: Otomatik yedek listesi
ipcMain.handle('list-auto-backups', () => {
  try {
    const dir = getAutoBackupDir();
    const dosyalar = fs.readdirSync(dir)
      .filter(f => f.startsWith('oto-yedek-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .map(f => {
        const stat = fs.statSync(path.join(dir, f));
        return { filename: f, size: stat.size, mtime: stat.mtime.toISOString() };
      });
    return { ok: true, dosyalar, dir };
  } catch(e) {
    return { ok: false, dosyalar: [], dir: '' };
  }
});

// ── IPC: Otomatik yedek indir (kaydet dialogu)
ipcMain.handle('download-auto-backup', async (event, filename) => {
  try {
    const dir = getAutoBackupDir();
    const src = path.join(dir, filename);
    if (!fs.existsSync(src)) return { ok: false, error: 'Dosya bulunamadı' };

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      title: 'Yedeği Kaydet',
      filters: [{ name: 'JSON Yedek', extensions: ['json'] }]
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    fs.copyFileSync(src, filePath);
    return { ok: true, path: filePath };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Otomatik yedek sil
ipcMain.handle('delete-auto-backup', (event, filename) => {
  try {
    const dir = getAutoBackupDir();
    const dosya = path.join(dir, filename);
    if (fs.existsSync(dosya)) fs.unlinkSync(dosya);
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Yedek klasörü yolu
ipcMain.handle('get-auto-backup-dir', () => {
  return getAutoBackupDir();
});

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
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  splashWindow.loadFile(path.join(__dirname, 'public', 'splash.html'));
}

function createMain() {
  mainWindow = new BrowserWindow({
    width: 1360, height: 860,
    minWidth: 1024, minHeight: 680,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'İÇDER Kurban Programı'
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
    printWin.webContents.print({
      silent: false,
      printBackground: true,
      color: true,
      margins: { marginType: 'none' },
      landscape: false,
      scaleFactor: 100,
      pagesPerSheet: 1,
      collate: false,
      copies: 1,
      pageSize: 'A4',
      headerFooter: {
        title: '',
        url: ''
      }
    }, (success, errorType) => {
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
    execSync('netsh advfirewall firewall add rule name="İÇDER Kurban 4500" dir=in action=allow protocol=TCP localport=4500', { stdio: 'ignore' });
  } catch(e) {}

  createSplash();
  const expressApp = require('./server');
  server = http.createServer(expressApp);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') waitForServer(() => createMain());
  });
  server.on('listening', () => waitForServer(() => {
    createMain();
    // Sunucu hazır olunca oto yedek başlat (ayarları DB'den okur)
    setTimeout(otoYedekBaslat, 5000);
  }));
  server.listen(PORT, '0.0.0.0');
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
