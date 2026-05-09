const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'bagislar.json');
const USERS_FILE = path.join(DATA_DIR, 'kullanicilar.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Data klasörü yoksa oluştur
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, '{}');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, data, status = 200) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.mp4': 'video/mp4', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.gif': 'image/gif'
  };
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback - index.html döndür
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  }
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // OPTIONS preflight
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  // ---- API ROUTES ----

  // GET /api/config
  if (req.method === 'GET' && pathname === '/api/config') {
    return json(res, readJSON(CONFIG_FILE));
  }

  // POST /api/config
  if (req.method === 'POST' && pathname === '/api/config') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        writeJSON(CONFIG_FILE, config);
        json(res, { ok: true });
      } catch { json(res, { error: 'Gecersiz veri' }, 400); }
    });
    return;
  }

  // GET /api/bagislar
  if (req.method === 'GET' && pathname === '/api/bagislar') {
    return json(res, readJSON(DB_FILE));
  }

  // POST /api/bagislar
  if (req.method === 'POST' && pathname === '/api/bagislar') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const bagis = JSON.parse(body);
        const list = readJSON(DB_FILE);
        const yeni = {
          id: 'B' + Date.now(),
          tarih: new Date().toISOString(),
          durum: (bagis.tur||'').includes('Kurban') ? 'bekliyor' : 'tamamlandi',
          not: (bagis.tur||'').includes('Kurban')
            ? 'Kurban kesim işleminiz devam etmekte. Kesildikten sonra buradan görebilirsiniz.'
            : '',
          ekNot: '',
          ...bagis
        };
        list.push(yeni);
        writeJSON(DB_FILE, list);
        json(res, yeni, 201);
      } catch { json(res, { error: 'Gecersiz veri' }, 400); }
    });
    return;
  }

  // PUT /api/bagislar/:id
  if (req.method === 'PUT' && pathname.startsWith('/api/bagislar/')) {
    const id = pathname.split('/')[3];
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const degisiklikler = JSON.parse(body);
        const list = readJSON(DB_FILE);
        const idx = list.findIndex(b => b.id === id);
        if (idx === -1) return json(res, { error: 'Bulunamadi' }, 404);
        list[idx] = { ...list[idx], ...degisiklikler };
        writeJSON(DB_FILE, list);
        json(res, list[idx]);
      } catch { json(res, { error: 'Gecersiz veri' }, 400); }
    });
    return;
  }

  // DELETE /api/bagislar/:id
  if (req.method === 'DELETE' && pathname.startsWith('/api/bagislar/')) {
    const id = pathname.split('/')[3];
    const list = readJSON(DB_FILE).filter(b => b.id !== id);
    writeJSON(DB_FILE, list);
    return json(res, { ok: true });
  }

  // GET /api/kullanicilar
  if (req.method === 'GET' && pathname === '/api/kullanicilar') {
    return json(res, readJSON(USERS_FILE));
  }

  // POST /api/kullanicilar
  if (req.method === 'POST' && pathname === '/api/kullanicilar') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const { ad, soyad, tel, email } = JSON.parse(body);
        const users = readJSON(USERS_FILE);
        const kullaniciAdi = (ad + soyad).toLowerCase()
          .replace(/\s/g,'').replace(/ğ/g,'g').replace(/ü/g,'u')
          .replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c');
        let user = users.find(u => u.kullaniciAdi === kullaniciAdi);
        if (!user) {
          user = { kullaniciAdi, ad, soyad, tel, email, kayitTarihi: new Date().toISOString() };
          users.push(user);
          writeJSON(USERS_FILE, users);
        }
        json(res, user, 201);
      } catch { json(res, { error: 'Gecersiz veri' }, 400); }
    });
    return;
  }

  // GET /api/kullanicilar/:kullaniciAdi
  if (req.method === 'GET' && pathname.startsWith('/api/kullanicilar/')) {
    const ka = decodeURIComponent(pathname.split('/')[3]);
    const user = readJSON(USERS_FILE).find(u => u.kullaniciAdi === ka);
    if (!user) return json(res, { error: 'Bulunamadi' }, 404);
    return json(res, user);
  }

  // ---- STATIC FILES ----
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // /bagis → bagis/index.html
  if (pathname === '/bagis' || pathname === '/bagis/') {
    filePath = path.join(__dirname, 'bagis/index.html');
  }
  // /yonetim → yonetim/index.html
  else if (pathname === '/yonetim' || pathname === '/yonetim/') {
    filePath = path.join(__dirname, 'yonetim/index.html');
  }
  // /hesaplar → hesaplar/index.html
  else if (pathname === '/hesaplar' || pathname === '/hesaplar/') {
    filePath = path.join(__dirname, 'hesaplar/index.html');
  }
  // /bagislarim → bagislarim.html
  else if (pathname === '/bagislarim') {
    filePath = path.join(__dirname, 'bagislarim.html');
  }
  // /bagis/kurban gibi sub-routelar → bagis/index.html
  else if (pathname.startsWith('/bagis/')) {
    filePath = path.join(__dirname, 'bagis/index.html');
  }

  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`ICDER sunucu calisiyor: http://localhost:${PORT}`);
  console.log(`Veri klasoru: ${DATA_DIR}`);
});
