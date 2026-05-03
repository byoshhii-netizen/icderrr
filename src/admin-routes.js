const router = require('express').Router();
const multer = require('multer');
const { getDb } = process.env.RAILWAY_ENVIRONMENT || process.env.PORT
  ? require('./database-web')
  : require('./database');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

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

  res.json({ toplamOrg, toplamKurban, toplamHisse, bekleyenTalep });
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
  try {
    const list = db.prepare('SELECT * FROM medya_deposu ORDER BY yuklenme_tarihi DESC LIMIT 500').all();
    res.json(list);
  } catch (e) {
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
  db.prepare("INSERT OR REPLACE INTO sistem_ayarlari (anahtar, deger) VALUES ('sistem_modu', ?)").run(mod);
  db.prepare("INSERT OR REPLACE INTO sistem_ayarlari (anahtar, deger) VALUES ('sistem_notu', ?)").run(not || '');

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
    db.prepare("INSERT OR REPLACE INTO sistem_ayarlari (anahtar, deger) VALUES ('admin_sifre', ?)").run(yeni_sifre);
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

// ─── ORGANİZASYON CRUD ──────────────────────────────────────────────────────
router.post('/org-olustur', adminKontrol, async (req, res) => {
  const db = await getDb();
  const { ad, yil, max_kurban, buyukbas_hisse_fiyati, kucukbas_hisse_fiyati } = req.body;
  if (!ad || !yil || !max_kurban) return res.status(400).json({ hata: 'Zorunlu alanlar eksik' });
  const r = db.prepare(`INSERT INTO organizasyonlar (ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,kullanici_id)
    VALUES (?,?,?,?,?,1)`).run(ad, yil, max_kurban, buyukbas_hisse_fiyati || 0, kucukbas_hisse_fiyati || 0);
  res.json({ ok: true, id: r.lastInsertRowid });
});

router.put('/org-guncelle/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  const { ad, yil, max_kurban, buyukbas_hisse_fiyati, kucukbas_hisse_fiyati } = req.body;
  db.prepare(`UPDATE organizasyonlar SET ad=?,yil=?,max_kurban=?,buyukbas_hisse_fiyati=?,kucukbas_hisse_fiyati=? WHERE id=?`)
    .run(ad, yil, max_kurban, buyukbas_hisse_fiyati || 0, kucukbas_hisse_fiyati || 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/org-sil/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  const kurbanlar = db.prepare('SELECT id FROM kurbanlar WHERE organizasyon_id=?').all(req.params.id);
  kurbanlar.forEach(k => db.prepare('DELETE FROM hisseler WHERE kurban_id=?').run(k.id));
  db.prepare('DELETE FROM kurbanlar WHERE organizasyon_id=?').run(req.params.id);
  db.prepare('DELETE FROM organizasyonlar WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── YAZDIRMA AYARLARI YÖNETİMİ ────────────────────────────────────────────
router.get('/yazdirma-ayarlari', adminKontrol, async (req, res) => {
  const db = await getDb();
  const list = db.prepare('SELECT kullanici_id, logo_data, bayrak_data, kurulum_tamamlandi FROM ayarlar ORDER BY kullanici_id').all();
  res.json(list);
});

router.delete('/yazdirma-ayar-sil', adminKontrol, async (req, res) => {
  const { kullanici_id } = req.body;
  if (!kullanici_id) return res.status(400).json({ hata: 'Kullanıcı ID gerekli' });

  const db = await getDb();
  db.prepare('DELETE FROM ayarlar WHERE kullanici_id=?').run(kullanici_id);
  res.json({ ok: true });
});

// ─── TÜM BAĞIŞÇILAR ─────────────────────────────────────────────────────────
router.get('/bagiscilar', adminKontrol, async (req, res) => {
  const db = await getDb();
  const list = db.prepare(`
    SELECT h.*, k.kurban_no, k.tur, o.ad as org_ad, o.id as org_id
    FROM hisseler h
    JOIN kurbanlar k ON h.kurban_id = k.id
    JOIN organizasyonlar o ON k.organizasyon_id = o.id
    WHERE h.bagisci_adi IS NOT NULL
    ORDER BY h.olusturma DESC
    LIMIT 2000
  `).all();
  res.json(list);
});

router.put('/bagisci-guncelle/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  const { bagisci_adi, bagisci_telefon, kimin_adina, kimin_adina_telefon, odeme_durumu, video_ister } = req.body;
  db.prepare(`UPDATE hisseler SET bagisci_adi=?,bagisci_telefon=?,kimin_adina=?,kimin_adina_telefon=?,odeme_durumu=?,video_ister=? WHERE id=?`)
    .run(bagisci_adi || null, bagisci_telefon || null, kimin_adina || null, kimin_adina_telefon || null, odeme_durumu || 'bekliyor', video_ister ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/bagisci-sil/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  db.prepare(`UPDATE hisseler SET bagisci_adi=NULL,bagisci_telefon=NULL,kimin_adina=NULL,kimin_adina_telefon=NULL,odeme_durumu='bekliyor',video_ister=0 WHERE id=?`)
    .run(req.params.id);
  res.json({ ok: true });
});

// ─── YEDEK SİSTEMİ ──────────────────────────────────────────────────────────

// Yedek verisi oluşturan ortak fonksiyon
async function yedekVerisiOlustur(db) {
  const organizasyonlar = db.prepare('SELECT * FROM organizasyonlar ORDER BY id ASC').all();
  const yedek = {
    versiyon: '2.0',
    tarih: new Date().toISOString(),
    organizasyonlar: []
  };
  for (const org of organizasyonlar) {
    const kurbanlar = db.prepare('SELECT * FROM kurbanlar WHERE organizasyon_id=? ORDER BY kurban_no ASC').all(org.id);
    const orgData = { ...org, kurbanlar: [] };
    for (const k of kurbanlar) {
      const hisseler = db.prepare(
        'SELECT id, kurban_id, hisse_no, bagisci_adi, bagisci_telefon, kimin_adina, kimin_adina_telefon, odeme_durumu, video_ister, aciklama, olusturma FROM hisseler WHERE kurban_id=? ORDER BY hisse_no ASC'
      ).all(k.id);
      orgData.kurbanlar.push({ ...k, hisseler });
    }
    yedek.organizasyonlar.push(orgData);
  }
  try {
    const ayarlar = db.prepare('SELECT logo_data, bayrak_data, icder_sifre FROM ayarlar WHERE kullanici_id=1').get();
    if (ayarlar) yedek.yazdirma_ayarlari = ayarlar;
  } catch (e) {}
  return yedek;
}

// Admin paneli yedek indir
router.get('/yedek-al', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    const yedek = await yedekVerisiOlustur(db);
    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="icder-yedek-${tarih}.json"`);
    res.json(yedek);
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Electron'un otomatik yedek sistemi için (auth gerektirmez, sadece localhost)
router.get('/yedek-al-internal', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  if (!ip.includes('127.0.0.1') && !ip.includes('::1') && !ip.includes('localhost')) {
    return res.status(403).json({ hata: 'Sadece localhost' });
  }
  const db = await getDb();
  try {
    const yedek = await yedekVerisiOlustur(db);
    res.json(yedek);
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Yedek geri yükle (JSON body)
router.post('/yedek-yukle', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    const yedek = req.body;
    if (!yedek || !yedek.organizasyonlar) {
      return res.status(400).json({ hata: 'Geçersiz yedek dosyası' });
    }

    let yuklenenOrg = 0, yuklenenKurban = 0, yuklenenHisse = 0;

    for (const org of yedek.organizasyonlar) {
      const mevcut = db.prepare('SELECT id FROM organizasyonlar WHERE id=?').get(org.id);
      if (!mevcut) {
        db.prepare(`INSERT OR IGNORE INTO organizasyonlar (id,ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama,aktif,kullanici_id,olusturma)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
          org.id, org.ad, org.yil, org.max_kurban,
          org.buyukbas_hisse_fiyati || 0, org.kucukbas_hisse_fiyati || 0,
          org.aciklama || null, org.aktif ?? 1, org.kullanici_id || 1, org.olusturma
        );
        yuklenenOrg++;
      }

      for (const k of (org.kurbanlar || [])) {
        const mevcut_k = db.prepare('SELECT id FROM kurbanlar WHERE id=?').get(k.id);
        if (!mevcut_k) {
          db.prepare(`INSERT OR IGNORE INTO kurbanlar (id,organizasyon_id,kurban_no,tur,kurban_turu,kesen_kisi,kupe_no,alis_fiyati,toplam_hisse,kesildi,kesim_tarihi,aciklama,kucukbas_sayi,olusturma)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            k.id, k.organizasyon_id, k.kurban_no, k.tur,
            k.kurban_turu || 'Udhiye', k.kesen_kisi || null, k.kupe_no || null,
            k.alis_fiyati || 0, k.toplam_hisse, k.kesildi || 0,
            k.kesim_tarihi || null, k.aciklama || null, k.kucukbas_sayi || 1, k.olusturma
          );
          yuklenenKurban++;
        }

        for (const h of (k.hisseler || [])) {
          const mevcut_h = db.prepare('SELECT id FROM hisseler WHERE id=?').get(h.id);
          if (!mevcut_h) {
            db.prepare(`INSERT OR IGNORE INTO hisseler (id,kurban_id,hisse_no,bagisci_adi,bagisci_telefon,kimin_adina,kimin_adina_telefon,odeme_durumu,video_ister,aciklama,olusturma)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
              h.id, h.kurban_id, h.hisse_no,
              h.bagisci_adi || null, h.bagisci_telefon || null,
              h.kimin_adina || null, h.kimin_adina_telefon || null,
              h.odeme_durumu || 'bekliyor', h.video_ister || 0,
              h.aciklama || null, h.olusturma
            );
            yuklenenHisse++;
          } else if (h.bagisci_adi) {
            db.prepare(`UPDATE hisseler SET bagisci_adi=COALESCE(bagisci_adi,?), bagisci_telefon=COALESCE(bagisci_telefon,?),
              kimin_adina=COALESCE(kimin_adina,?), kimin_adina_telefon=COALESCE(kimin_adina_telefon,?),
              odeme_durumu=COALESCE(odeme_durumu,?) WHERE id=?`).run(
              h.bagisci_adi, h.bagisci_telefon || null,
              h.kimin_adina || null, h.kimin_adina_telefon || null,
              h.odeme_durumu || 'bekliyor', h.id
            );
          }
        }
      }
    }

    if (yedek.yazdirma_ayarlari) {
      const ya = yedek.yazdirma_ayarlari;
      const mevcut_a = db.prepare('SELECT id FROM ayarlar WHERE kullanici_id=1').get();
      if (mevcut_a) {
        if (ya.logo_data) db.prepare('UPDATE ayarlar SET logo_data=? WHERE kullanici_id=1').run(ya.logo_data);
        if (ya.bayrak_data) db.prepare('UPDATE ayarlar SET bayrak_data=? WHERE kullanici_id=1').run(ya.bayrak_data);
      }
    }

    res.json({ ok: true, yuklenenOrg, yuklenenKurban, yuklenenHisse });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Yedek geri yükle - dosya upload ile
router.post('/yedek-yukle-dosya', adminKontrol, upload.single('yedek'), async (req, res) => {
  const db = await getDb();
  try {
    if (!req.file) return res.status(400).json({ hata: 'Dosya yüklenmedi' });
    const yedek = JSON.parse(req.file.buffer.toString('utf8'));
    if (!yedek || !yedek.organizasyonlar) {
      return res.status(400).json({ hata: 'Geçersiz yedek dosyası' });
    }

    let yuklenenOrg = 0, yuklenenKurban = 0, yuklenenHisse = 0;

    for (const org of yedek.organizasyonlar) {
      const mevcut = db.prepare('SELECT id FROM organizasyonlar WHERE id=?').get(org.id);
      if (!mevcut) {
        db.prepare(`INSERT OR IGNORE INTO organizasyonlar (id,ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama,aktif,kullanici_id,olusturma)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
          org.id, org.ad, org.yil, org.max_kurban,
          org.buyukbas_hisse_fiyati || 0, org.kucukbas_hisse_fiyati || 0,
          org.aciklama || null, org.aktif ?? 1, org.kullanici_id || 1, org.olusturma
        );
        yuklenenOrg++;
      }

      for (const k of (org.kurbanlar || [])) {
        const mevcut_k = db.prepare('SELECT id FROM kurbanlar WHERE id=?').get(k.id);
        if (!mevcut_k) {
          db.prepare(`INSERT OR IGNORE INTO kurbanlar (id,organizasyon_id,kurban_no,tur,kurban_turu,kesen_kisi,kupe_no,alis_fiyati,toplam_hisse,kesildi,kesim_tarihi,aciklama,kucukbas_sayi,olusturma)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            k.id, k.organizasyon_id, k.kurban_no, k.tur,
            k.kurban_turu || 'Udhiye', k.kesen_kisi || null, k.kupe_no || null,
            k.alis_fiyati || 0, k.toplam_hisse, k.kesildi || 0,
            k.kesim_tarihi || null, k.aciklama || null, k.kucukbas_sayi || 1, k.olusturma
          );
          yuklenenKurban++;
        }

        for (const h of (k.hisseler || [])) {
          const mevcut_h = db.prepare('SELECT id FROM hisseler WHERE id=?').get(h.id);
          if (!mevcut_h) {
            db.prepare(`INSERT OR IGNORE INTO hisseler (id,kurban_id,hisse_no,bagisci_adi,bagisci_telefon,kimin_adina,kimin_adina_telefon,odeme_durumu,video_ister,aciklama,olusturma)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
              h.id, h.kurban_id, h.hisse_no,
              h.bagisci_adi || null, h.bagisci_telefon || null,
              h.kimin_adina || null, h.kimin_adina_telefon || null,
              h.odeme_durumu || 'bekliyor', h.video_ister || 0,
              h.aciklama || null, h.olusturma
            );
            yuklenenHisse++;
          } else if (h.bagisci_adi) {
            db.prepare(`UPDATE hisseler SET bagisci_adi=COALESCE(bagisci_adi,?), bagisci_telefon=COALESCE(bagisci_telefon,?),
              kimin_adina=COALESCE(kimin_adina,?), kimin_adina_telefon=COALESCE(kimin_adina_telefon,?),
              odeme_durumu=COALESCE(odeme_durumu,?) WHERE id=?`).run(
              h.bagisci_adi, h.bagisci_telefon || null,
              h.kimin_adina || null, h.kimin_adina_telefon || null,
              h.odeme_durumu || 'bekliyor', h.id
            );
          }
        }
      }
    }

    if (yedek.yazdirma_ayarlari) {
      const ya = yedek.yazdirma_ayarlari;
      const mevcut_a = db.prepare('SELECT id FROM ayarlar WHERE kullanici_id=1').get();
      if (mevcut_a) {
        if (ya.logo_data) db.prepare('UPDATE ayarlar SET logo_data=? WHERE kullanici_id=1').run(ya.logo_data);
        if (ya.bayrak_data) db.prepare('UPDATE ayarlar SET bayrak_data=? WHERE kullanici_id=1').run(ya.bayrak_data);
      }
    }

    res.json({ ok: true, yuklenenOrg, yuklenenKurban, yuklenenHisse });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Otomatik yedek klasöründen dosya adıyla yükle
router.post('/oto-yedek-yukle', adminKontrol, async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ hata: 'Dosya adı gerekli' });
  // Güvenlik: sadece oto-yedek- ile başlayan .json dosyaları
  if (!filename.startsWith('oto-yedek-') || !filename.endsWith('.json') || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ hata: 'Geçersiz dosya adı' });
  }

  const fs = require('fs');
  const path = require('path');
  let dir;
  try {
    const { app } = require('electron');
    dir = path.join(app.getPath('userData'), 'otomatik-yedek');
  } catch (e) {
    dir = path.join(__dirname, '..', 'otomatik-yedek');
  }

  const dosyaYolu = path.join(dir, filename);
  if (!fs.existsSync(dosyaYolu)) return res.status(404).json({ hata: 'Dosya bulunamadı' });

  try {
    const yedek = JSON.parse(fs.readFileSync(dosyaYolu, 'utf8'));
    if (!yedek || !yedek.organizasyonlar) return res.status(400).json({ hata: 'Geçersiz yedek' });

    const db = await getDb();
    let yuklenenOrg = 0, yuklenenKurban = 0, yuklenenHisse = 0;

    for (const org of yedek.organizasyonlar) {
      const mevcut = db.prepare('SELECT id FROM organizasyonlar WHERE id=?').get(org.id);
      if (!mevcut) {
        db.prepare(`INSERT OR IGNORE INTO organizasyonlar (id,ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama,aktif,kullanici_id,olusturma)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
          org.id, org.ad, org.yil, org.max_kurban,
          org.buyukbas_hisse_fiyati || 0, org.kucukbas_hisse_fiyati || 0,
          org.aciklama || null, org.aktif ?? 1, org.kullanici_id || 1, org.olusturma
        );
        yuklenenOrg++;
      }

      for (const k of (org.kurbanlar || [])) {
        const mevcut_k = db.prepare('SELECT id FROM kurbanlar WHERE id=?').get(k.id);
        if (!mevcut_k) {
          db.prepare(`INSERT OR IGNORE INTO kurbanlar (id,organizasyon_id,kurban_no,tur,kurban_turu,kesen_kisi,kupe_no,alis_fiyati,toplam_hisse,kesildi,kesim_tarihi,aciklama,kucukbas_sayi,olusturma)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            k.id, k.organizasyon_id, k.kurban_no, k.tur,
            k.kurban_turu || 'Udhiye', k.kesen_kisi || null, k.kupe_no || null,
            k.alis_fiyati || 0, k.toplam_hisse, k.kesildi || 0,
            k.kesim_tarihi || null, k.aciklama || null, k.kucukbas_sayi || 1, k.olusturma
          );
          yuklenenKurban++;
        }

        for (const h of (k.hisseler || [])) {
          const mevcut_h = db.prepare('SELECT id FROM hisseler WHERE id=?').get(h.id);
          if (!mevcut_h) {
            db.prepare(`INSERT OR IGNORE INTO hisseler (id,kurban_id,hisse_no,bagisci_adi,bagisci_telefon,kimin_adina,kimin_adina_telefon,odeme_durumu,video_ister,aciklama,olusturma)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
              h.id, h.kurban_id, h.hisse_no,
              h.bagisci_adi || null, h.bagisci_telefon || null,
              h.kimin_adina || null, h.kimin_adina_telefon || null,
              h.odeme_durumu || 'bekliyor', h.video_ister || 0,
              h.aciklama || null, h.olusturma
            );
            yuklenenHisse++;
          } else if (h.bagisci_adi) {
            db.prepare(`UPDATE hisseler SET bagisci_adi=COALESCE(bagisci_adi,?), bagisci_telefon=COALESCE(bagisci_telefon,?),
              kimin_adina=COALESCE(kimin_adina,?), kimin_adina_telefon=COALESCE(kimin_adina_telefon,?),
              odeme_durumu=COALESCE(odeme_durumu,?) WHERE id=?`).run(
              h.bagisci_adi, h.bagisci_telefon || null,
              h.kimin_adina || null, h.kimin_adina_telefon || null,
              h.odeme_durumu || 'bekliyor', h.id
            );
          }
        }
      }
    }

    res.json({ ok: true, yuklenenOrg, yuklenenKurban, yuklenenHisse });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// ─── OTOMATİK YEDEK AYARI ───────────────────────────────────────────────────
router.get('/otomatik-yedek-ayar', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    const aktif  = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='oto_yedek_aktif'").get();
    const dakika = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='oto_yedek_dakika'").get();
    res.json({
      aktif:  aktif?.deger  !== '0',          // varsayılan: açık
      dakika: parseInt(dakika?.deger || '10') // varsayılan: 10 dk
    });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

router.post('/otomatik-yedek-ayar', adminKontrol, async (req, res) => {
  const { aktif, dakika } = req.body;
  const db = await getDb();
  try {
    db.prepare("INSERT OR REPLACE INTO sistem_ayarlari (anahtar, deger) VALUES ('oto_yedek_aktif', ?)").run(aktif ? '1' : '0');
    const dk = Math.max(1, Math.min(1440, parseInt(dakika) || 10));
    db.prepare("INSERT OR REPLACE INTO sistem_ayarlari (anahtar, deger) VALUES ('oto_yedek_dakika', ?)").run(String(dk));
    res.json({ ok: true, aktif, dakika: dk });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// ─── KATEGORİ YÖNETİMİ ──────────────────────────────────────────────────────
// Tüm kategorileri listele
router.get('/kategoriler', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    const list = db.prepare('SELECT * FROM ozel_kategoriler ORDER BY olusturma DESC').all();
    res.json(list);
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Yeni kategori ekle
router.post('/kategori-ekle', adminKontrol, async (req, res) => {
  const { kategori_adi, kategori_tipi } = req.body;
  if (!kategori_adi) return res.status(400).json({ hata: 'Kategori adı gerekli' });
  
  const db = await getDb();
  try {
    const r = db.prepare('INSERT INTO ozel_kategoriler (kategori_adi, kategori_tipi, aktif) VALUES (?, ?, 1)')
      .run(kategori_adi, kategori_tipi || 'bagisci');
    res.json({ ok: true, id: r.lastInsertRowid });
  } catch (e) { 
    if (e.message.includes('UNIQUE')) {
      res.status(400).json({ hata: 'Bu kategori zaten mevcut' });
    } else {
      res.status(500).json({ hata: e.message }); 
    }
  }
});

// Kategori güncelle
router.put('/kategori-guncelle/:id', adminKontrol, async (req, res) => {
  const { kategori_adi, kategori_tipi, aktif } = req.body;
  if (!kategori_adi) return res.status(400).json({ hata: 'Kategori adı gerekli' });
  
  const db = await getDb();
  try {
    db.prepare('UPDATE ozel_kategoriler SET kategori_adi=?, kategori_tipi=?, aktif=? WHERE id=?')
      .run(kategori_adi, kategori_tipi || 'bagisci', aktif ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Kategori sil
router.delete('/kategori-sil/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    db.prepare('DELETE FROM ozel_kategoriler WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// ─── FİLTRE YÖNETİMİ ────────────────────────────────────────────────────────
// Tüm filtreleri listele
router.get('/filtreler', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    const list = db.prepare('SELECT * FROM ozel_filtreler ORDER BY olusturma DESC').all();
    res.json(list);
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Yeni filtre ekle
router.post('/filtre-ekle', adminKontrol, async (req, res) => {
  const { filtre_adi, filtre_tipi, filtre_degeri } = req.body;
  if (!filtre_adi || !filtre_tipi) return res.status(400).json({ hata: 'Filtre adı ve tipi gerekli' });
  
  const db = await getDb();
  try {
    const r = db.prepare('INSERT INTO ozel_filtreler (filtre_adi, filtre_tipi, filtre_degeri, aktif) VALUES (?, ?, ?, 1)')
      .run(filtre_adi, filtre_tipi, filtre_degeri || '');
    res.json({ ok: true, id: r.lastInsertRowid });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Filtre güncelle
router.put('/filtre-guncelle/:id', adminKontrol, async (req, res) => {
  const { filtre_adi, filtre_tipi, filtre_degeri, aktif } = req.body;
  if (!filtre_adi || !filtre_tipi) return res.status(400).json({ hata: 'Filtre adı ve tipi gerekli' });
  
  const db = await getDb();
  try {
    db.prepare('UPDATE ozel_filtreler SET filtre_adi=?, filtre_tipi=?, filtre_degeri=?, aktif=? WHERE id=?')
      .run(filtre_adi, filtre_tipi, filtre_degeri || '', aktif ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Filtre sil
router.delete('/filtre-sil/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    db.prepare('DELETE FROM ozel_filtreler WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// ─── GİRİŞ LOGOSU YÖNETİMİ ──────────────────────────────────────────────────
// Aktif logoyu getir
router.get('/giris-logosu', async (req, res) => {
  const db = await getDb();
  try {
    const logo = db.prepare('SELECT * FROM giris_logosu WHERE aktif=1 ORDER BY olusturma DESC LIMIT 1').get();
    res.json(logo || { logo_data: null });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Tüm logoları listele (admin)
router.get('/giris-logolari', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    const list = db.prepare('SELECT * FROM giris_logosu ORDER BY olusturma DESC').all();
    res.json(list);
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Yeni logo ekle
router.post('/giris-logosu-ekle', adminKontrol, async (req, res) => {
  const { logo_data } = req.body;
  if (!logo_data) return res.status(400).json({ hata: 'Logo verisi gerekli' });
  
  const db = await getDb();
  try {
    // Önce tüm logoları pasif yap
    db.prepare('UPDATE giris_logosu SET aktif=0').run();
    // Yeni logoyu ekle ve aktif yap
    const r = db.prepare('INSERT INTO giris_logosu (logo_data, aktif) VALUES (?, 1)').run(logo_data);
    res.json({ ok: true, id: r.lastInsertRowid });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Logo güncelle
router.put('/giris-logosu-guncelle/:id', adminKontrol, async (req, res) => {
  const { logo_data, aktif } = req.body;
  
  const db = await getDb();
  try {
    if (aktif) {
      // Eğer bu logo aktif yapılıyorsa, diğerlerini pasif yap
      db.prepare('UPDATE giris_logosu SET aktif=0').run();
    }
    
    if (logo_data) {
      db.prepare('UPDATE giris_logosu SET logo_data=?, aktif=? WHERE id=?')
        .run(logo_data, aktif ? 1 : 0, req.params.id);
    } else {
      db.prepare('UPDATE giris_logosu SET aktif=? WHERE id=?')
        .run(aktif ? 1 : 0, req.params.id);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

// Logo sil
router.delete('/giris-logosu-sil/:id', adminKontrol, async (req, res) => {
  const db = await getDb();
  try {
    db.prepare('DELETE FROM giris_logosu WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ hata: e.message }); }
});

module.exports = router;
