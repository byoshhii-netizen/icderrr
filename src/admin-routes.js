const router = require('express').Router();
const { getDb } = require('./database-web');

// Admin middleware
async function adminKontrol(req, res, next) {
  if (!req.session.adminGiris) {
    return res.status(401).json({ hata: 'Admin girişi gerekli' });
  }
  next();
}

// ─── ADMIN GİRİŞ ────────────────────────────────────────────────────────────
router.post('/giris', async (req, res) => {
  const { sifre } = req.body;
  if (!sifre) return res.status(400).json({ hata: 'Şifre gerekli' });

  const db = await getDb();
  const ayar = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='admin_sifre'").get();
  const dogruSifre = ayar?.deger || 'BeYA0411';

  if (sifre === dogruSifre) {
    req.session.adminGiris = Date.now();
    res.json({ ok: true });
  } else {
    res.status(401).json({ hata: 'Şifre yanlış' });
  }
});

// ─── ADMIN ÇIKIŞ ────────────────────────────────────────────────────────────
router.post('/cikis', (req, res) => {
  delete req.session.adminGiris;
  res.json({ ok: true });
});

// ─── DASHBOARD İSTATİSTİKLER ───────────────────────────────────────────────
router.get('/dashboard', adminKontrol, async (req, res) => {
  const db = await getDb();
  
  const toplamOrg = db.prepare('SELECT COUNT(*) as sayi FROM organizasyonlar').get().sayi;
  const toplamKurban = db.prepare('SELECT COUNT(*) as sayi FROM kurbanlar').get().sayi;
  const toplamHisse = db.prepare('SELECT COUNT(*) as sayi FROM hisseler WHERE bagisci_adi IS NOT NULL').get().sayi;
  const bekleyenTalep = db.prepare('SELECT COUNT(*) as sayi FROM destek_talepleri WHERE okundu=0').get().sayi;
  
  res.json({
    toplamOrg,
    toplamKurban,
    toplamHisse,
    bekleyenTalep
  });
});

// ─── TÜM ORGANİZASYONLAR ────────────────────────────────────────────────────
router.get('/organizasyonlar', adminKontrol, async (req, res) => {
  const db = await getDb();
  const list = db.prepare('SELECT * FROM organizasyonlar ORDER BY olusturma DESC').all();
  res.json(list);
});

// ─── TÜM KURBANLAR ──────────────────────────────────────────────────────────
router.get('/kurbanlar', adminKontrol, async (req, res) => {
  const db = await getDb();
  const list = db.prepare(`
    SELECT k.*, o.ad as org_ad 
    FROM kurbanlar k 
    LEFT JOIN organizasyonlar o ON k.organizasyon_id = o.id 
    ORDER BY k.olusturma DESC 
    LIMIT 1000
  `).all();
  res.json(list);
});

// ─── TÜM MEDYA ──────────────────────────────────────────────────────────────
router.get('/medya', adminKontrol, async (req, res) => {
  const db = await getDb();
  // Medya deposu tablosu yoksa boş dön
  try {
    const list = db.prepare('SELECT * FROM medya_deposu ORDER BY yuklenme_tarihi DESC LIMIT 500').all();
    res.json(list);
  } catch(e) {
    res.json([]);
  }
});

// ─── SİSTEM MODU ────────────────────────────────────────────────────────────
router.get('/sistem-modu', async (req, res) => {
  const db = await getDb();
  const mod = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='sistem_modu'").get();
  const not = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='sistem_notu'").get();
  
  res.json({
    mod: mod?.deger || 'acik',
    not: not?.deger || ''
  });
});

router.post('/sistem-modu', adminKontrol, async (req, res) => {
  const { mod, not } = req.body;
  if (!['acik', 'bakim', 'kapali'].includes(mod)) {
    return res.status(400).json({ hata: 'Geçersiz mod' });
  }

  const db = await getDb();
  db.prepare("UPDATE sistem_ayarlari SET deger=? WHERE anahtar='sistem_modu'").run(mod);
  db.prepare("UPDATE sistem_ayarlari SET deger=? WHERE anahtar='sistem_notu'").run(not || '');
  
  res.json({ ok: true });
});

// ─── ŞİFRE YÖNETİMİ ─────────────────────────────────────────────────────────
router.post('/sifre-degistir', adminKontrol, async (req, res) => {
  const { tur, yeni_sifre } = req.body;
  if (!tur || !yeni_sifre) {
    return res.status(400).json({ hata: 'Tür ve yeni şifre gerekli' });
  }

  const db = await getDb();
  
  if (tur === 'admin') {
    db.prepare("UPDATE sistem_ayarlari SET deger=? WHERE anahtar='admin_sifre'").run(yeni_sifre);
  } else if (tur === 'icder') {
    db.prepare("UPDATE ayarlar SET icder_sifre=? WHERE kullanici_id=1").run(yeni_sifre);
  } else {
    return res.status(400).json({ hata: 'Geçersiz tür' });
  }
  
  res.json({ ok: true });
});

// ─── DESTEK TALEPLERİ ───────────────────────────────────────────────────────
router.get('/talepler', adminKontrol, async (req, res) => {
  const db = await getDb();
  const list = db.prepare('SELECT * FROM destek_talepleri ORDER BY olusturma DESC').all();
  res.json(list);
});

router.post('/talep-okundu', adminKontrol, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ hata: 'ID gerekli' });

  const db = await getDb();
  db.prepare('UPDATE destek_talepleri SET okundu=1, guncelleme=CURRENT_TIMESTAMP WHERE id=?').run(id);
  res.json({ ok: true });
});

router.post('/talep-cevapla', adminKontrol, async (req, res) => {
  const { id, cevap } = req.body;
  if (!id || !cevap) return res.status(400).json({ hata: 'ID ve cevap gerekli' });

  const db = await getDb();
  db.prepare('UPDATE destek_talepleri SET admin_cevap=?, durum=?, okundu=1, guncelleme=CURRENT_TIMESTAMP WHERE id=?')
    .run(cevap, 'cevaplandi', id);
  res.json({ ok: true });
});

router.delete('/talep-sil', adminKontrol, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ hata: 'ID gerekli' });

  const db = await getDb();
  db.prepare('DELETE FROM destek_talepleri WHERE id=?').run(id);
  res.json({ ok: true });
});

module.exports = router;
