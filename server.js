const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
  
  // Sistem modu kontrolü
  try {
    const { getDb } = require('./src/database-web');
    const db = await getDb();
    const modAyar = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='sistem_modu'").get();
    const notAyar = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='sistem_notu'").get();
    
    const sistemModu = modAyar?.deger || 'acik';
    const sistemNotu = notAyar?.deger || '';
    
    if (sistemModu === 'kapali') {
      return res.send(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Sistem Kapalı</title>
        <style>body{font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a1a;color:#fff}
        .box{text-align:center;padding:40px;background:#2a2a2a;border-radius:12px;max-width:500px}
        h1{color:#ef4444;margin:0 0 20px}p{color:#999;line-height:1.6}</style></head>
        <body><div class="box"><h1><i class="fa-solid fa-power-off"></i> Sistem Kapalı</h1>
        <p>${sistemNotu || 'Sistem şu anda kapalıdır. Lütfen daha sonra tekrar deneyin.'}</p></div></body></html>
      `);
    }
    
    if (sistemModu === 'bakim') {
      return res.send(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Bakım Modu</title>
        <style>body{font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a1a;color:#fff}
        .box{text-align:center;padding:40px;background:#2a2a2a;border-radius:12px;max-width:500px}
        h1{color:#f59e0b;margin:0 0 20px}p{color:#999;line-height:1.6}</style></head>
        <body><div class="box"><h1><i class="fa-solid fa-wrench"></i> Bakım Modu</h1>
        <p>${sistemNotu || 'Sistem bakımdadır. Lütfen daha sonra tekrar deneyin.'}</p></div></body></html>
      `);
    }
  } catch(e) {
    console.error('Sistem modu kontrolü hatası:', e);
  }
  
  // İçder giriş kontrolü
  if (req.session.icderGiris) {
    const gecenSure = Date.now() - req.session.icderGiris;
    const yirmidortSaat = 24 * 60 * 60 * 1000; // 24 saat
    if (gecenSure < yirmidortSaat) {
      return next(); // Giriş yapılmış ve 24 saat geçmemiş
    } else {
      // Oturum süresi dolmuş, session'ı temizle
      delete req.session.icderGiris;
    }
  }
  
  // Giriş yapılmamış veya süresi dolmuş, icder-giris'e yönlendir
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
