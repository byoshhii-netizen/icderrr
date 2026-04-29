const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// index.html hariç statik dosyalar (CSS, JS, resimler vs.)
app.use(express.static(path.join(__dirname, 'public'), {
  index: false // index.html'i otomatik servis etme, middleware'den geçsin
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'defterdar-cms-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 saat
}));

app.use('/api/auth', require('./src/auth'));
app.use('/api', require('./src/routes'));
app.use('/api/medya', require('./src/cloudinary'));
app.use('/api/destek', require('./src/destek-routes'));
app.use('/api/admin', require('./src/admin-routes'));

app.get('/giris', (req, res) => res.sendFile(path.join(__dirname, 'public', 'giris.html')));
app.get('/kayit', (req, res) => res.sendFile(path.join(__dirname, 'public', 'giris.html')));
app.get('/icder-giris', (req, res) => res.sendFile(path.join(__dirname, 'public', 'icder-giris.html')));
app.get('/admin-giris', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-giris.html')));
app.get('/admin', (req, res) => {
  // Admin girişi kontrolü
  if (!req.session.adminGiris) {
    return res.redirect('/admin-giris');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// İçder giriş kontrolü middleware
async function icderGirisKontrol(req, res, next) {
  // API istekleri, statik dosyalar ve giriş sayfası için kontrol yapma
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/fa') || 
      req.path === '/icder-giris' || 
      req.path === '/icder-giris.html' ||
      req.path === '/admin' ||
      req.path === '/admin-giris' ||
      req.path === '/admin-giris.html' ||
      req.path.includes('.css') ||
      req.path.includes('.js') ||
      req.path.includes('.png') ||
      req.path.includes('.jpg') ||
      req.path.includes('.ico')) {
    return next();
  }

  // ─── SİSTEM MODU KONTROLÜ ───────────────────────────────────────────────
  try {
    const { getDb } = process.env.RAILWAY_ENVIRONMENT || process.env.PORT
      ? require('./src/database-web')
      : require('./src/database');
    const db = await getDb();
    const modRow = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='sistem_modu'").get();
    const notRow = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='sistem_notu'").get();
    const mod = modRow?.deger || 'acik';
    const not = notRow?.deger || '';

    if (mod === 'bakim' || mod === 'kapali') {
      // Admin oturumu varsa geçir
      if (req.session.adminGiris) return next();
      // İçder oturumu varsa da çıkar
      delete req.session.icderGiris;
      const modText = mod === 'bakim' ? '🔧 Bakım Modu' : '🔒 Sistem Kapalı';
      const renk = mod === 'bakim' ? '#f59e0b' : '#ef4444';
      return res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${modText} — İÇDER Kurban</title>
        <link rel="stylesheet" href="/fa/css/all.min.css"/>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Segoe UI',sans-serif;background:#0a1410;color:#e8f5ee;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
          .wrap{max-width:480px;width:100%}
          .icon{font-size:72px;margin-bottom:24px;color:${renk}}
          h1{font-size:28px;font-weight:800;color:${renk};margin-bottom:12px}
          p{font-size:15px;color:#a8c9b8;line-height:1.7;margin-bottom:24px}
          .note{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;font-size:14px;color:#e8f5ee;margin-bottom:24px}
          a{color:${renk};text-decoration:none;font-size:14px;padding:10px 20px;border:1px solid ${renk};border-radius:8px;display:inline-block;margin-top:8px}
          a:hover{background:${renk};color:#fff}
        </style>
      </head><body>
        <div class="wrap">
          <div class="icon"><i class="fa-solid ${mod === 'bakim' ? 'fa-wrench' : 'fa-lock'}"></i></div>
          <h1>${modText}</h1>
          <p>${mod === 'bakim' ? 'Sistem şu anda bakım modunda. Kısa süre içinde tekrar erişilebilir olacak.' : 'Sistem şu anda kapalı. Lütfen daha sonra tekrar deneyin.'}</p>
          ${not ? `<div class="note"><i class="fa-solid fa-circle-info" style="margin-right:6px"></i><strong>Yönetici Notu:</strong><br><br>${not}</div>` : ''}
          <a href="/admin-giris"><i class="fa-solid fa-shield-halved" style="margin-right:6px"></i>Yönetici Girişi</a>
        </div>
      </body></html>`);
    }
  } catch(e) { /* DB hatası olursa devam et */ }
  
  // İçder giriş kontrolü
  if (req.session.icderGiris) {
    const gecenSure = Date.now() - req.session.icderGiris;
    const yirmidortSaat = 24 * 60 * 60 * 1000;
    if (gecenSure < yirmidortSaat) {
      return next();
    } else {
      delete req.session.icderGiris;
    }
  }
  
  return res.redirect('/icder-giris');
}

app.use(icderGirisKontrol);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ ok: false });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Defterdar Muhasebe: http://localhost:${PORT}`);
  });
}
