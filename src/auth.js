const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('./database-web');

// ─── KAYIT ─────────────────────────────────────────────────────────────────
router.post('/kayit', async (req, res) => {
  const { kullanici_adi, email, sifre } = req.body;
  if (!kullanici_adi || !email || !sifre)
    return res.status(400).json({ hata: 'Tum alanlar zorunlu' });
  if (sifre.length < 6)
    return res.status(400).json({ hata: 'Sifre en az 6 karakter olmali' });

  const db = await getDb();
  const mevcut = db.prepare('SELECT id FROM kullanicilar WHERE kullanici_adi=? OR email=?').get(kullanici_adi, email);
  if (mevcut) return res.status(400).json({ hata: 'Bu kullanici adi veya email zaten kayitli' });

  const hash = bcrypt.hashSync(sifre, 10);
  const r = db.prepare('INSERT INTO kullanicilar (kullanici_adi, email, sifre_hash) VALUES (?,?,?)').run(kullanici_adi, email, hash);
  req.session.userId = r.lastInsertRowid;
  req.session.kullaniciAdi = kullanici_adi;
  res.json({ ok: true, kullanici_adi });
});

// ─── GİRİŞ ─────────────────────────────────────────────────────────────────
router.post('/giris', async (req, res) => {
  const { kullanici_adi, sifre } = req.body;
  if (!kullanici_adi || !sifre)
    return res.status(400).json({ hata: 'Kullanici adi ve sifre zorunlu' });

  const db = await getDb();
  const user = db.prepare('SELECT * FROM kullanicilar WHERE kullanici_adi=?').get(kullanici_adi);
  if (!user) return res.status(401).json({ hata: 'Kullanici adi veya sifre yanlis' });

  const eslesme = bcrypt.compareSync(sifre, user.sifre_hash);
  if (!eslesme) return res.status(401).json({ hata: 'Kullanici adi veya sifre yanlis' });

  req.session.userId = user.id;
  req.session.kullaniciAdi = user.kullanici_adi;
  res.json({ ok: true, kullanici_adi: user.kullanici_adi });
});

// ─── ÇIKIŞ ─────────────────────────────────────────────────────────────────
router.post('/cikis', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// ─── DURUM ─────────────────────────────────────────────────────────────────
router.get('/durum', (req, res) => {
  if (req.session.userId) {
    res.json({ girisYapildi: true, kullanici_adi: req.session.kullaniciAdi, userId: req.session.userId });
  } else {
    res.json({ girisYapildi: false });
  }
});

// ─── İÇDER KURBAN ŞİFRE KONTROLÜ ───────────────────────────────────────────
router.post('/icder-sifre-kontrol', async (req, res) => {
  const { sifre } = req.body;
  if (!sifre) return res.status(400).json({ hata: 'Şifre gerekli' });

  const db = await getDb();
  // Ayarlar tablosundan şifreyi al
  const ayar = db.prepare('SELECT icder_sifre FROM ayarlar WHERE kullanici_id=1').get();
  const dogruSifre = ayar?.icder_sifre || '571571'; // Varsayılan şifre

  if (sifre === dogruSifre) {
    req.session.icderGiris = Date.now(); // Giriş zamanını kaydet
    res.json({ ok: true });
  } else {
    res.status(401).json({ hata: 'Şifre yanlış' });
  }
});

// ─── İÇDER ŞİFRE DEĞİŞTİRME ────────────────────────────────────────────────
router.post('/icder-sifre-degistir', async (req, res) => {
  const { mevcut_sifre, yeni_sifre } = req.body;
  if (!mevcut_sifre || !yeni_sifre) {
    return res.status(400).json({ hata: 'Mevcut şifre ve yeni şifre gerekli' });
  }

  const db = await getDb();
  // Mevcut şifreyi kontrol et
  const ayar = db.prepare('SELECT icder_sifre FROM ayarlar WHERE kullanici_id=1').get();
  const mevcutSifre = ayar?.icder_sifre || '571571'; // Varsayılan şifre

  if (mevcut_sifre !== mevcutSifre) {
    return res.status(401).json({ hata: 'Mevcut şifre yanlış' });
  }

  // Ayarlar tablosunda şifreyi güncelle
  const mevcut = db.prepare('SELECT id FROM ayarlar WHERE kullanici_id=1').get();
  if (mevcut) {
    db.prepare('UPDATE ayarlar SET icder_sifre=? WHERE kullanici_id=1').run(yeni_sifre);
  } else {
    db.prepare('INSERT INTO ayarlar (kullanici_id, icder_sifre) VALUES (1, ?)').run(yeni_sifre);
  }

  res.json({ ok: true });
});

// ─── İÇDER GİRİŞ DURUMU ────────────────────────────────────────────────────
router.get('/icder-giris-durumu', (req, res) => {
  if (req.session.icderGiris) {
    const gecenSure = Date.now() - req.session.icderGiris;
    const birGun = 24 * 60 * 60 * 1000; // 24 saat
    if (gecenSure < birGun) {
      return res.json({ girisYapildi: true });
    }
  }
  res.json({ girisYapildi: false });
});

module.exports = router;
