const router = require('express').Router();
const { getDb } = process.env.RAILWAY_ENVIRONMENT || process.env.PORT
  ? require('./database-web')
  : require('./database');

// ─── AUTH MIDDLEWARE (EXE İÇİN KALDIRILDI) ────────────────────────────────
// EXE versiyonunda giriş sistemi yok, direkt erişim
// function requireAuth(req, res, next) {
//   if (!req.session || !req.session.userId) {
//     return res.status(401).json({ hata: 'Giris yapmaniz gerekiyor' });
//   }
//   next();
// }

// router.use(requireAuth);

// EXE için: Sabit kullanıcı ID'si (1)
router.use((req, res, next) => {
  if (!req.session) req.session = {};
  req.session.userId = 1; // Sabit kullanıcı
  next();
});

// ─── ORGANİZASYONLAR ───────────────────────────────────────────────────────

router.get('/organizasyonlar', async (req, res) => {
  const db = await getDb();
  res.json(db.prepare('SELECT * FROM organizasyonlar WHERE kullanici_id=? ORDER BY olusturma DESC').all(req.session.userId));
});

router.post('/organizasyonlar', async (req, res) => {
  const db = await getDb();
  const { ad, yil, max_kurban, buyukbas_hisse_fiyati, kucukbas_hisse_fiyati, aciklama } = req.body;
  if (!ad || !yil || !max_kurban) return res.status(400).json({ hata: 'Zorunlu alanlar eksik' });
  const r = db.prepare(`INSERT INTO organizasyonlar (ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama,kullanici_id)
    VALUES (?,?,?,?,?,?,?)`).run(ad, yil, max_kurban, buyukbas_hisse_fiyati || 0, kucukbas_hisse_fiyati || 0, aciklama || null, req.session.userId);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/organizasyonlar/:id', async (req, res) => {
  const db = await getDb();
  const { ad, yil, max_kurban, buyukbas_hisse_fiyati, kucukbas_hisse_fiyati, aciklama, aktif } = req.body;
  db.prepare(`UPDATE organizasyonlar SET ad=?,yil=?,max_kurban=?,buyukbas_hisse_fiyati=?,kucukbas_hisse_fiyati=?,aciklama=?,aktif=? WHERE id=? AND kullanici_id=?`)
    .run(ad, yil, max_kurban, buyukbas_hisse_fiyati, kucukbas_hisse_fiyati, aciklama, aktif ?? 1, req.params.id, req.session.userId);
  res.json({ ok: true });
});

router.delete('/organizasyonlar/:id', async (req, res) => {
  const db = await getDb();
  const org = db.prepare('SELECT * FROM organizasyonlar WHERE id=? AND kullanici_id=?').get(req.params.id, req.session.userId);
  if (!org) return res.status(404).json({ hata: 'Bulunamadi' });
  // Tüm kurban ve hisseleri topla
  const kurbanlar = db.prepare('SELECT * FROM kurbanlar WHERE organizasyon_id=?').all(req.params.id);
  const hisselerMap = {};
  kurbanlar.forEach(k => { hisselerMap[k.id] = db.prepare('SELECT * FROM hisseler WHERE kurban_id=?').all(k.id); });
  // Çöp kutusuna ekle
  db.prepare('INSERT INTO cop_kutusu (tur, veri) VALUES (?,?)').run('organizasyon', JSON.stringify({ org, kurbanlar, hisselerMap }));
  // Sil
  kurbanlar.forEach(k => db.prepare('DELETE FROM hisseler WHERE kurban_id=?').run(k.id));
  db.prepare('DELETE FROM kurbanlar WHERE organizasyon_id=?').run(req.params.id);
  db.prepare('DELETE FROM organizasyonlar WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── KURBANLAR ──────────────────────────────────────────────────────────────

router.get('/organizasyonlar/:orgId/kurbanlar', async (req, res) => {
  const db = await getDb();
  const { tur, durum } = req.query;
  const orgId = req.params.orgId;

  let allKurbanlar = db.prepare(`SELECT k.*,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.bagisci_adi IS NOT NULL) as dolu_hisse,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.odeme_durumu='odendi') as _odendi_sayi,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.bagisci_adi IS NOT NULL AND h.odeme_durumu='bekliyor') as _bekliyor_sayi,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.video_ister=1) as _video_sayi,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.vekalet_onay=1) as _vekalet_sayi
    FROM kurbanlar k WHERE k.organizasyon_id=? ORDER BY k.kurban_no ASC`).all(orgId);

  if (tur) allKurbanlar = allKurbanlar.filter(k => k.tur === tur);
  if (durum === 'bos') allKurbanlar = allKurbanlar.filter(k => !k.kesildi && k.dolu_hisse < k.toplam_hisse);
  if (durum === 'doldu') allKurbanlar = allKurbanlar.filter(k => !k.kesildi && k.dolu_hisse >= k.toplam_hisse);
  if (durum === 'kesildi') allKurbanlar = allKurbanlar.filter(k => k.kesildi);

  res.json(allKurbanlar);
});

router.post('/organizasyonlar/:orgId/kurbanlar', async (req, res) => {
  const db = await getDb();
  const orgId = req.params.orgId;
  const org = db.prepare('SELECT * FROM organizasyonlar WHERE id=?').get(orgId);
  if (!org) return res.status(404).json({ hata: 'Organizasyon bulunamadi' });

  const mevcutSayi = db.prepare('SELECT COUNT(*) as c FROM kurbanlar WHERE organizasyon_id=?').get(orgId).c;
  if (mevcutSayi >= org.max_kurban) return res.status(400).json({ hata: 'Maksimum kurban sayisina ulasildi' });

  const { tur, kupe_no, alis_fiyati, aciklama, kurban_turu, kesen_kisi, kucukbas_sayi } = req.body;
  if (!tur) return res.status(400).json({ hata: 'Tur zorunlu' });

  // Türe göre ayrı numaralama: büyükbaş kendi içinde, küçükbaş kendi içinde
  const maxNoTur = db.prepare('SELECT MAX(kurban_no) as m FROM kurbanlar WHERE organizasyon_id=? AND tur=?').get(orgId, tur);
  const kurban_no = (maxNoTur?.m || 0) + 1;
  const toplam_hisse = tur === 'buyukbas' ? 7 : 1;

  const r = db.prepare(`INSERT INTO kurbanlar (organizasyon_id,kurban_no,tur,kupe_no,alis_fiyati,fiyat,toplam_hisse,aciklama,kurban_turu,kesen_kisi,kucukbas_sayi)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(orgId, kurban_no, tur, kupe_no || null, alis_fiyati || 0, alis_fiyati || 0, toplam_hisse, aciklama || null, kurban_turu || 'Udhiye', kesen_kisi || null, kucukbas_sayi || 1);

  const kurbanId = r.lastInsertRowid;
  for (let i = 1; i <= toplam_hisse; i++) {
    db.prepare('INSERT INTO hisseler (kurban_id,hisse_no) VALUES (?,?)').run(kurbanId, i);
  }

  res.status(201).json({ id: kurbanId, kurban_no, toplam_hisse });
});

router.put('/kurbanlar/:id', async (req, res) => {
  const db = await getDb();
  const { kupe_no, alis_fiyati, kesildi, kesim_tarihi, aciklama, kurban_turu, kesen_kisi, kucukbas_sayi } = req.body;
  db.prepare(`UPDATE kurbanlar SET kupe_no=?,alis_fiyati=?,fiyat=?,kesildi=?,kesim_tarihi=?,aciklama=?,kurban_turu=?,kesen_kisi=?,kucukbas_sayi=? WHERE id=?`)
    .run(kupe_no || null, alis_fiyati || 0, alis_fiyati || 0, kesildi ? 1 : 0, kesim_tarihi || null, aciklama || null,
      kurban_turu || 'Udhiye', kesen_kisi || null, kucukbas_sayi || 1, req.params.id);
  res.json({ ok: true });
});

router.delete('/kurbanlar/:id', async (req, res) => {
  const db = await getDb();
  const k = db.prepare('SELECT * FROM kurbanlar WHERE id=?').get(req.params.id);
  if (!k) return res.status(404).json({ hata: 'Bulunamadi' });
  const hisseler = db.prepare('SELECT * FROM hisseler WHERE kurban_id=?').all(req.params.id);
  db.prepare('INSERT INTO cop_kutusu (tur, veri) VALUES (?,?)').run('kurban', JSON.stringify({ kurban: k, hisseler }));
  db.prepare('DELETE FROM hisseler WHERE kurban_id=?').run(req.params.id);
  db.prepare('DELETE FROM kurbanlar WHERE id=?').run(req.params.id);

  // Silme sonrası kurban_no'ları türe göre ayrı ayrı yeniden sırala
  ['buyukbas', 'kucukbas'].forEach(turAdi => {
    const kalanlar = db.prepare('SELECT id FROM kurbanlar WHERE organizasyon_id=? AND tur=? ORDER BY kurban_no ASC').all(k.organizasyon_id, turAdi);
    kalanlar.forEach((row, idx) => {
      db.prepare('UPDATE kurbanlar SET kurban_no=? WHERE id=?').run(idx + 1, row.id);
    });
  });

  res.json({ ok: true });
});

// ─── HİSSELER ──────────────────────────────────────────────────────────────

router.get('/kurbanlar/:kurbanId/hisseler', async (req, res) => {
  const db = await getDb();
  res.json(db.prepare('SELECT * FROM hisseler WHERE kurban_id=? ORDER BY hisse_no').all(req.params.kurbanId));
});

router.put('/hisseler/:id', async (req, res) => {
  const db = await getDb();
  const { bagisci_adi, bagisci_telefon, bagisci_kategori, kimin_adina, kimin_adina_telefon, odeme_durumu, video_ister, aciklama, kurban_turu, vekalet_onay } = req.body;
  const vekalet_tarihi = vekalet_onay ? new Date().toISOString() : null;
  // kurban_turu gönderilmemişse mevcut değeri koru
  const mevcutHisse = db.prepare('SELECT kurban_turu FROM hisseler WHERE id=?').get(req.params.id);
  const finalKurbanTuru = kurban_turu || (mevcutHisse && mevcutHisse.kurban_turu) || 'Udhiye';
  db.prepare(`UPDATE hisseler SET bagisci_adi=?,bagisci_telefon=?,bagisci_kategori=?,kimin_adina=?,kimin_adina_telefon=?,odeme_durumu=?,video_ister=?,aciklama=?,kurban_turu=?,vekalet_onay=?,vekalet_tarihi=? WHERE id=?`)
    .run(bagisci_adi || null, bagisci_telefon || null, bagisci_kategori || 'Genel Bağışçı', kimin_adina || null, kimin_adina_telefon || null,
      odeme_durumu || 'bekliyor', video_ister ? 1 : 0, aciklama || null, finalKurbanTuru, vekalet_onay ? 1 : 0, vekalet_tarihi, req.params.id);
  res.json({ ok: true });
});

router.delete('/hisseler/:id/temizle', async (req, res) => {
  const db = await getDb();
  db.prepare(`UPDATE hisseler SET bagisci_adi=NULL,bagisci_telefon=NULL,bagisci_kategori='Genel Bağışçı',kimin_adina=NULL,kimin_adina_telefon=NULL,odeme_durumu='bekliyor',video_ister=0,aciklama=NULL,kurban_turu='Udhiye',vekalet_onay=0,vekalet_tarihi=NULL WHERE id=?`)
    .run(req.params.id);
  res.json({ ok: true });
});

// ─── HİSSE VİDEO KAYDET ────────────────────────────────────────────────────
router.put('/hisseler/:id/video', async (req, res) => {
  const db = await getDb();
  const { video_url, video_public_id } = req.body;
  db.prepare('UPDATE hisseler SET video_url=?, video_public_id=? WHERE id=?')
    .run(video_url || null, video_public_id || null, req.params.id);
  res.json({ ok: true });
});

// ─── HİSSE VİDEO SİL ───────────────────────────────────────────────────────
router.delete('/hisseler/:id/video', async (req, res) => {
  const db = await getDb();
  const h = db.prepare('SELECT video_public_id FROM hisseler WHERE id=?').get(req.params.id);
  // Cloudinary'den sil
  if (h && h.video_public_id) {
    try {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(h.video_public_id, { resource_type: 'video' });
    } catch(e) {}
  }
  db.prepare('UPDATE hisseler SET video_url=NULL, video_public_id=NULL WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── ORGANİZASYON VİDEOLARI ────────────────────────────────────────────────
router.get('/organizasyonlar/:orgId/videolar', async (req, res) => {
  const db = await getDb();
  const list = db.prepare(`
    SELECT h.id, h.hisse_no, h.bagisci_adi, h.bagisci_telefon, h.video_url, h.video_public_id,
           k.kurban_no, k.tur, k.kurban_turu
    FROM hisseler h
    JOIN kurbanlar k ON h.kurban_id = k.id
    WHERE k.organizasyon_id = ? AND h.video_url IS NOT NULL
    ORDER BY k.kurban_no, h.hisse_no
  `).all(req.params.orgId);
  res.json(list);
});

// ─── VEKALET TOGGLE ────────────────────────────────────────────────────────
router.put('/hisseler/:id/vekalet', async (req, res) => {
  const db = await getDb();
  const { vekalet_onay } = req.body;
  const vekalet_tarihi = vekalet_onay ? new Date().toISOString() : null;
  db.prepare(`UPDATE hisseler SET vekalet_onay=?, vekalet_tarihi=? WHERE id=?`)
    .run(vekalet_onay ? 1 : 0, vekalet_tarihi, req.params.id);
  res.json({ ok: true });
});

// ─── TOPLU İŞLEMLER (BAĞIŞÇI) ──────────────────────────────────────────────

router.post('/hisseler/toplu-odeme', async (req, res) => {
  try {
    const db = await getDb();
    const { ids, odeme_durumu } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ hata: 'ids gerekli' });
    const placeholders = ids.map(() => '?').join(',');
    const info = db.prepare(`UPDATE hisseler SET odeme_durumu=? WHERE id IN (${placeholders})`).run(odeme_durumu || 'bekliyor', ...ids);
    res.json({ ok: true, etkilenen: info.changes });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

router.post('/hisseler/toplu-vekalet', async (req, res) => {
  try {
    const db = await getDb();
    const { ids, vekalet_onay } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ hata: 'ids gerekli' });
    const vekalet_tarihi = vekalet_onay ? new Date().toISOString() : null;
    const placeholders = ids.map(() => '?').join(',');
    const info = db.prepare(`UPDATE hisseler SET vekalet_onay=?, vekalet_tarihi=? WHERE id IN (${placeholders})`).run(vekalet_onay ? 1 : 0, vekalet_tarihi, ...ids);
    res.json({ ok: true, etkilenen: info.changes });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

router.post('/hisseler/toplu-sil', async (req, res) => {
  try {
    const db = await getDb();
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ hata: 'ids gerekli' });
    const placeholders = ids.map(() => '?').join(',');
    const info = db.prepare(`UPDATE hisseler SET bagisci_adi=NULL,bagisci_telefon=NULL,bagisci_kategori='Genel Bağışçı',kimin_adina=NULL,kimin_adina_telefon=NULL,odeme_durumu='bekliyor',video_ister=0,aciklama=NULL,kurban_turu='Udhiye',vekalet_onay=0,vekalet_tarihi=NULL WHERE id IN (${placeholders})`).run(...ids);
    res.json({ ok: true, etkilenen: info.changes });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});



// ─── BAĞIŞÇI ARAMA ─────────────────────────────────────────────────────────

router.get('/bagiscilar/ara', async (req, res) => {
  const db = await getDb();
  const { q, orgId, tumunu } = req.query;
  let list;
  if (tumunu === '1' && orgId) {
    // Tüm bağışçıları getir - organizasyon fiyatlarından otomatik hesapla
    // Büyükbaş: buyukbas_hisse_fiyati (kişi başı hisse fiyatı)
    // Küçükbaş: kucukbas_hisse_fiyati
    list = db.prepare(`
      SELECT h.*,
        k.kurban_no, k.tur, k.organizasyon_id, k.id as kurban_id,
        CASE
          WHEN k.tur = 'buyukbas' THEN COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), o.buyukbas_hisse_fiyati, 0)
          ELSE COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), o.kucukbas_hisse_fiyati, 0)
        END as kurban_fiyat
      FROM hisseler h
      JOIN kurbanlar k ON h.kurban_id = k.id
      JOIN organizasyonlar o ON k.organizasyon_id = o.id
      WHERE h.bagisci_adi IS NOT NULL AND k.organizasyon_id = ?
      ORDER BY h.olusturma DESC, h.id DESC LIMIT 500
    `).all(orgId);
  } else {
    if (!q) return res.json([]);
    const like = `%${q.toLowerCase()}%`;
    const telLike = `%${q.replace(/^\+/, '')}%`;
    list = db.prepare(`
      SELECT h.*,
        k.kurban_no, k.tur, k.organizasyon_id, k.id as kurban_id,
        CASE
          WHEN k.tur = 'buyukbas' THEN COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), o.buyukbas_hisse_fiyati, 0)
          ELSE COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), o.kucukbas_hisse_fiyati, 0)
        END as kurban_fiyat
      FROM hisseler h
      JOIN kurbanlar k ON h.kurban_id = k.id
      JOIN organizasyonlar o ON k.organizasyon_id = o.id
      WHERE h.bagisci_adi IS NOT NULL AND (
        LOWER(h.bagisci_adi) LIKE ?
        OR LOWER(COALESCE(h.bagisci_telefon,'')) LIKE ?
        OR REPLACE(COALESCE(h.bagisci_telefon,''), '+', '') LIKE ?
        OR LOWER(COALESCE(h.kimin_adina,'')) LIKE ?
      )
      ORDER BY h.bagisci_adi LIMIT 100
    `).all(like, like, telLike, like);
    if (orgId) list = list.filter(h => String(h.organizasyon_id) === String(orgId));
  }
  res.json(list);
});

// ─── KURBAN + HİSSELER TOPLU KAYIT (Bağışçı Ekle akışı) ───────────────────

router.post('/organizasyonlar/:orgId/kurban-ve-hisseler', async (req, res) => {
  const db = await getDb();
  const orgId = req.params.orgId;
  const org = db.prepare('SELECT * FROM organizasyonlar WHERE id=?').get(orgId);
  if (!org) return res.status(404).json({ hata: 'Organizasyon bulunamadi' });

  const mevcutSayi = db.prepare('SELECT COUNT(*) as c FROM kurbanlar WHERE organizasyon_id=?').get(orgId).c;
  if (mevcutSayi >= org.max_kurban) return res.status(400).json({ hata: 'Maksimum kurban sayisina ulasildi' });

  const { tur, kupe_no, alis_fiyati, aciklama, hisseler, kurban_turu, kesen_kisi, kucukbas_sayi } = req.body;
  if (!tur) return res.status(400).json({ hata: 'Tur zorunlu' });

  const maxNo2 = db.prepare('SELECT MAX(kurban_no) as m FROM kurbanlar WHERE organizasyon_id=? AND tur=?').get(orgId, tur);
  const kurban_no = (maxNo2?.m || 0) + 1;
  const toplam_hisse = tur === 'buyukbas' ? 7 : 1;

  // Kurbanı oluştur
  const r = db.prepare(`INSERT INTO kurbanlar (organizasyon_id,kurban_no,tur,kupe_no,alis_fiyati,toplam_hisse,aciklama,kurban_turu,kesen_kisi,kucukbas_sayi)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(orgId, kurban_no, tur, kupe_no || null, alis_fiyati || 0, toplam_hisse, aciklama || null, kurban_turu || 'Udhiye', kesen_kisi || null, kucukbas_sayi || 1);
  const kurbanId = r.lastInsertRowid;

  // Hisseleri oluştur ve dolu olanları doldur
  for (let i = 1; i <= toplam_hisse; i++) {
    const hr = db.prepare('INSERT INTO hisseler (kurban_id,hisse_no) VALUES (?,?)').run(kurbanId, i);
    const hisseId = hr.lastInsertRowid;
    const h = hisseler && hisseler[i - 1];
    if (h && h.bagisci_adi && h.bagisci_adi.trim()) {
      const hisseKurbanTuru = h.kurban_turu || kurban_turu || 'Udhiye';
      db.prepare(`UPDATE hisseler SET bagisci_adi=?,bagisci_telefon=?,bagisci_kategori=?,kimin_adina=?,kimin_adina_telefon=?,odeme_durumu=?,video_ister=?,aciklama=?,kurban_turu=? WHERE id=?`)
        .run(h.bagisci_adi.trim(), h.bagisci_telefon||null, h.bagisci_kategori||'Genel Bağışçı', h.kimin_adina||null, h.kimin_adina_telefon||null,
          h.odeme_durumu||'bekliyor', h.video_ister?1:0, h.aciklama||null, hisseKurbanTuru, hisseId);
    }
  }

  res.status(201).json({ id: kurbanId, kurban_no, toplam_hisse });
});

router.get('/organizasyonlar/:orgId/dashboard', async (req, res) => {
  const db = await getDb();
  const orgId = req.params.orgId;
  const kurbanlar = db.prepare(`SELECT k.*,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.bagisci_adi IS NOT NULL) as dolu_hisse
    FROM kurbanlar k WHERE k.organizasyon_id=?`).all(orgId);

  const toplam_kurban = kurbanlar.length;
  const kesildi = kurbanlar.filter(k => k.kesildi).length;
  const toplam_hisse = kurbanlar.reduce((s, k) => s + k.toplam_hisse, 0);
  const dolu_hisse = kurbanlar.reduce((s, k) => s + k.dolu_hisse, 0);
  const bos_hisse = toplam_hisse - dolu_hisse;
  const doldu_kurban = kurbanlar.filter(k => !k.kesildi && k.dolu_hisse >= k.toplam_hisse).length;
  const bos_kurban = kurbanlar.filter(k => !k.kesildi && k.dolu_hisse < k.toplam_hisse).length;

  res.json({ toplam_kurban, kesildi, toplam_hisse, dolu_hisse, bos_hisse, doldu_kurban, bos_kurban });
});

// ─── İSTATİSTİK (Gelir-Gider ve Organizasyon Seç için) ─────────────────────
router.get('/organizasyonlar/:orgId/istatistik', async (req, res) => {
  const db = await getDb();
  const orgId = req.params.orgId;
  const kurbanlar = db.prepare('SELECT * FROM kurbanlar WHERE organizasyon_id=?').all(orgId);
  const hisseler = db.prepare(`SELECT h.* FROM hisseler h JOIN kurbanlar k ON h.kurban_id=k.id WHERE k.organizasyon_id=? AND h.bagisci_adi IS NOT NULL`).all(orgId);
  const buyukbas = kurbanlar.filter(k => k.tur === 'buyukbas').length;
  const kucukbas = kurbanlar.filter(k => k.tur === 'kucukbas').length;
  const toplamBagisci = hisseler.length;
  res.json({ buyukbas, kucukbas, toplamBagisci });
});

// ─── TÜM HİSSELER (organizasyon bazlı) ─────────────────────────────────────
router.get('/organizasyonlar/:orgId/hisseler', async (req, res) => {
  const db = await getDb();
  const orgId = req.params.orgId;
  const org = db.prepare('SELECT * FROM organizasyonlar WHERE id=?').get(orgId);
  const bbFiyat = org ? (org.buyukbas_hisse_fiyati || 0) : 0;
  const kbFiyat = org ? (org.kucukbas_hisse_fiyati || 0) : 0;
  const hisseler = db.prepare(`
    SELECT h.*, k.id as kurban_id, k.tur, k.kurban_no,
      CASE
        WHEN k.tur = 'buyukbas' THEN COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), ?, 0)
        ELSE COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), ?, 0)
      END as kurban_fiyat
    FROM hisseler h
    JOIN kurbanlar k ON h.kurban_id = k.id
    WHERE k.organizasyon_id = ?
    ORDER BY k.kurban_no, h.hisse_no
  `).all(bbFiyat, kbFiyat, orgId);
  res.json(hisseler);
});

// ─── TOPLU VERİ (Gelir-Gider ve Tüm Org için tek seferde) ──────────────────
router.get('/tum-organizasyonlar-ozet', async (req, res) => {
  const db = await getDb();
  const orgs = db.prepare('SELECT * FROM organizasyonlar WHERE kullanici_id=? ORDER BY olusturma DESC').all(req.session.userId);
  
  const result = orgs.map(org => {
    const kurbanlar = db.prepare('SELECT * FROM kurbanlar WHERE organizasyon_id=?').all(org.id);
    const hisseler = db.prepare(`
      SELECT h.*, k.tur, k.kurban_no, k.id as kurban_id,
        CASE
          WHEN k.tur = 'buyukbas' THEN COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), ?, 0)
          ELSE COALESCE(NULLIF(k.fiyat,0), NULLIF(k.alis_fiyati,0), ?, 0)
        END as kurban_fiyat
      FROM hisseler h
      JOIN kurbanlar k ON h.kurban_id = k.id
      WHERE k.organizasyon_id = ? AND h.bagisci_adi IS NOT NULL
    `).all(org.buyukbas_hisse_fiyati || 0, org.kucukbas_hisse_fiyati || 0, org.id);
    
    const buyukbas = kurbanlar.filter(k => k.tur === 'buyukbas').length;
    const kucukbas = kurbanlar.filter(k => k.tur === 'kucukbas').length;
    const toplamBagisci = hisseler.length;
    
    // Gelir hesapla - kurban fiyatı yoksa organizasyon fiyatını kullan
    let toplamGelir = 0, odenenGelir = 0, bekleyenGelir = 0, iptalGelir = 0;
    for (const k of kurbanlar) {
      const fiyat = k.fiyat || k.alis_fiyati ||
        (k.tur === 'buyukbas' ? (org.buyukbas_hisse_fiyati || 0) : (org.kucukbas_hisse_fiyati || 0));
      toplamGelir += fiyat;
    }
    for (const h of hisseler) {
      const fiyat = h.kurban_fiyat || 0;
      if (h.odeme_durumu === 'odendi') odenenGelir += fiyat;
      else if (h.odeme_durumu === 'bekliyor') bekleyenGelir += fiyat;
      else if (h.odeme_durumu === 'iptal') iptalGelir += fiyat;
    }
    
    return {
      org,
      kurbanlar: kurbanlar.map(k => ({
        ...k,
        dolu_hisse: hisseler.filter(h => h.kurban_id === k.id).length,
        fiyat: k.fiyat || k.alis_fiyati ||
          (k.tur === 'buyukbas' ? (org.buyukbas_hisse_fiyati || 0) : (org.kucukbas_hisse_fiyati || 0))
      })),
      hisseler,
      stats: { buyukbas, kucukbas, toplamBagisci, toplamGelir, odenenGelir, bekleyenGelir, iptalGelir }
    };
  });
  
  res.json(result);
});

// ─── RAPOR ─────────────────────────────────────────────────────────────────

router.get('/organizasyonlar/:orgId/rapor', async (req, res) => {
  const db = await getDb();
  const orgId = req.params.orgId;
  const org = db.prepare('SELECT * FROM organizasyonlar WHERE id=?').get(orgId);
  if (!org) return res.status(404).json({ hata: 'Organizasyon bulunamadi' });

  const kurbanlar = db.prepare(`SELECT k.*,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.bagisci_adi IS NOT NULL) as dolu_hisse
    FROM kurbanlar k WHERE k.organizasyon_id=? ORDER BY k.kurban_no`).all(orgId);

  const hisseler = db.prepare(`SELECT h.*, k.kurban_no, k.tur FROM hisseler h
    JOIN kurbanlar k ON h.kurban_id=k.id
    WHERE k.organizasyon_id=? AND h.bagisci_adi IS NOT NULL
    ORDER BY k.kurban_no, h.hisse_no`).all(orgId);

  const toplam_kurban = kurbanlar.length;
  const buyukbas = kurbanlar.filter(k => k.tur === 'buyukbas').length;
  const kucukbas = kurbanlar.filter(k => k.tur === 'kucukbas').length;
  const kesildi = kurbanlar.filter(k => k.kesildi).length;
  const toplam_hisse = kurbanlar.reduce((s, k) => s + k.toplam_hisse, 0);
  const dolu_hisse = hisseler.length;
  const odendi = hisseler.filter(h => h.odeme_durumu === 'odendi').length;
  const bekliyor = hisseler.filter(h => h.odeme_durumu === 'bekliyor').length;
  const toplam_gelir = kurbanlar.reduce((s, k) => {
    const org2 = db.prepare('SELECT * FROM organizasyonlar WHERE id=?').get(orgId);
    const fiyat = k.tur === 'buyukbas' ? org2.buyukbas_hisse_fiyati : org2.kucukbas_hisse_fiyati;
    const dolu = db.prepare('SELECT COUNT(*) as c FROM hisseler WHERE kurban_id=? AND bagisci_adi IS NOT NULL').get(k.id).c;
    return s + (fiyat * dolu);
  }, 0);

  res.json({ org, kurbanlar, hisseler, ozet: { toplam_kurban, buyukbas, kucukbas, kesildi, toplam_hisse, dolu_hisse, bos_hisse: toplam_hisse - dolu_hisse, odendi, bekliyor, toplam_gelir } });
});

// ─── EXCEL EXPORT ──────────────────────────────────────────────────────────

router.get('/organizasyonlar/:orgId/excel', async (req, res) => {
  const db = await getDb();
  const ExcelJS = require('exceljs');
  const orgId = req.params.orgId;
  const org = db.prepare('SELECT * FROM organizasyonlar WHERE id=?').get(orgId);
  if (!org) return res.status(404).json({ hata: 'Organizasyon bulunamadi' });

  const kurbanlar = db.prepare(`SELECT k.*,
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.bagisci_adi IS NOT NULL) as dolu_hisse
    FROM kurbanlar k WHERE k.organizasyon_id=? ORDER BY k.kurban_no`).all(orgId);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Defterdar Muhasebe - CMS Team';
  wb.created = new Date();

  // ── Sayfa 1: Kurbanlar
  const wsK = wb.addWorksheet('Kurbanlar');
  wsK.columns = [
    { header: 'Kurban No', key: 'kurban_no', width: 12 },
    { header: 'Hayvan Turu', key: 'tur', width: 14 },
    { header: 'Kurban Turu', key: 'kurban_turu', width: 14 },
    { header: 'Kupe No', key: 'kupe_no', width: 14 },
    { header: 'Alis Fiyati', key: 'alis_fiyati', width: 14 },
    { header: 'Kesen Kisi', key: 'kesen_kisi', width: 20 },
    { header: 'Toplam Hisse', key: 'toplam_hisse', width: 14 },
    { header: 'Dolu Hisse', key: 'dolu_hisse', width: 12 },
    { header: 'Durum', key: 'durum', width: 14 },
    { header: 'Kesildi', key: 'kesildi', width: 10 },
    { header: 'Kesim Tarihi', key: 'kesim_tarihi', width: 14 },
  ];
  wsK.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsK.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a2a50' } };
  kurbanlar.forEach(k => {
    wsK.addRow({
      kurban_no: k.kurban_no,
      tur: k.tur === 'buyukbas' ? 'Buyukbas' : 'Kucukbas',
      kurban_turu: k.kurban_turu || 'Udhiye',
      kupe_no: k.kupe_no || '-',
      alis_fiyati: k.alis_fiyati || 0,
      kesen_kisi: k.kesen_kisi || '-',
      toplam_hisse: k.toplam_hisse,
      dolu_hisse: k.dolu_hisse,
      durum: k.kesildi ? 'Kesildi' : k.dolu_hisse >= k.toplam_hisse ? 'Doldu' : 'Bos',
      kesildi: k.kesildi ? 'Evet' : 'Hayir',
      kesim_tarihi: k.kesim_tarihi || '-',
    });
  });

  // ── Sayfa 2: Bagiscilar
  const wsB = wb.addWorksheet('Bagiscilar');
  wsB.columns = [
    { header: 'Kurban No', key: 'kurban_no', width: 12 },
    { header: 'Tur', key: 'tur', width: 14 },
    { header: 'Hisse No', key: 'hisse_no', width: 10 },
    { header: 'Bagisci Adi', key: 'bagisci_adi', width: 22 },
    { header: 'Telefon', key: 'bagisci_telefon', width: 16 },
    { header: 'Kimin Adina', key: 'kimin_adina', width: 22 },
    { header: 'Odeme', key: 'odeme_durumu', width: 12 },
    { header: 'Video', key: 'video_ister', width: 8 },
  ];
  wsB.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsB.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a2a50' } };

  const hisseler = db.prepare(`SELECT h.*, k.kurban_no, k.tur FROM hisseler h
    JOIN kurbanlar k ON h.kurban_id=k.id
    WHERE k.organizasyon_id=? AND h.bagisci_adi IS NOT NULL
    ORDER BY k.kurban_no, h.hisse_no`).all(orgId);

  hisseler.forEach(h => {
    wsB.addRow({
      kurban_no: h.kurban_no,
      tur: h.tur === 'buyukbas' ? 'Buyukbas' : 'Kucukbas',
      hisse_no: h.hisse_no,
      bagisci_adi: h.bagisci_adi,
      bagisci_telefon: h.bagisci_telefon || '-',
      kimin_adina: h.kimin_adina || '-',
      odeme_durumu: h.odeme_durumu === 'odendi' ? 'Odendi' : h.odeme_durumu === 'iptal' ? 'Iptal' : 'Bekliyor',
      video_ister: h.video_ister ? 'Evet' : 'Hayir',
    });
  });

  // ── Sayfa 3: Yazdırma Ayarları (Logo ve Bayrak)
  const ayarlar = db.prepare('SELECT logo_data, bayrak_data FROM ayarlar WHERE kullanici_id=?').get(req.session.userId);
  if (ayarlar && (ayarlar.logo_data || ayarlar.bayrak_data)) {
    const wsA = wb.addWorksheet('Yazdirma Ayarlari');
    wsA.columns = [
      { header: 'Ayar', key: 'ayar', width: 20 },
      { header: 'Veri', key: 'veri', width: 100 },
    ];
    wsA.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsA.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a2a50' } };
    
    if (ayarlar.logo_data) {
      wsA.addRow({ ayar: 'Logo', veri: ayarlar.logo_data });
    }
    if (ayarlar.bayrak_data) {
      wsA.addRow({ ayar: 'Bayrak', veri: ayarlar.bayrak_data });
    }
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="defterdar-rapor.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// ─── TEK KURBAN EXCEL ──────────────────────────────────────────────────────

router.get('/kurbanlar/:id/excel', async (req, res) => {
  const db = await getDb();
  const ExcelJS = require('exceljs');
  const k = db.prepare('SELECT k.*, o.ad as org_ad, o.yil FROM kurbanlar k JOIN organizasyonlar o ON k.organizasyon_id=o.id WHERE k.id=?').get(req.params.id);
  if (!k) return res.status(404).json({ hata: 'Kurban bulunamadi' });

  const hisseler = db.prepare('SELECT * FROM hisseler WHERE kurban_id=? ORDER BY hisse_no').all(req.params.id);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Defterdar Muhasebe - CMS Team';
  const ws = wb.addWorksheet('Kurban #' + k.kurban_no);

  // Başlık bilgileri
  ws.addRow(['DEFTERDAR MUHASEBE - Kurban Belgesi']);
  ws.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF1a2a50' } };
  ws.addRow(['Organizasyon: ' + k.org_ad + ' | Yil: ' + k.yil + ' | Tarih: ' + new Date().toLocaleDateString('tr-TR')]);
  ws.addRow([]);
  ws.addRow(['Kurban No', '#' + k.kurban_no, 'Hayvan Turu', k.tur === 'buyukbas' ? 'Buyukbas' : 'Kucukbas']);
  ws.addRow(['Kurban Turu', k.kurban_turu || 'Udhiye', 'Kupe No', k.kupe_no || '-']);
  ws.addRow(['Alis Fiyati', k.alis_fiyati || 0, 'Kesen Kisi', k.kesen_kisi || '-']);
  ws.addRow(['Kesildi', k.kesildi ? 'Evet' : 'Hayir', 'Kesim Tarihi', k.kesim_tarihi || '-']);
  ws.addRow([]);

  // Hisseler tablosu
  const headerRow = ws.addRow(['Hisse No', 'Bagisci Adi', 'Telefon', 'Kimin Adina', 'Odeme', 'Video', 'Not']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a2a50' } };
  ws.columns = [
    { key: 'hisse_no', width: 10 }, { key: 'bagisci_adi', width: 22 },
    { key: 'bagisci_telefon', width: 16 }, { key: 'kimin_adina', width: 22 },
    { key: 'odeme_durumu', width: 12 }, { key: 'video_ister', width: 8 }, { key: 'aciklama', width: 20 }
  ];
  hisseler.forEach(h => {
    ws.addRow([h.hisse_no, h.bagisci_adi || '-', h.bagisci_telefon || '-', h.kimin_adina || '-',
      h.odeme_durumu === 'odendi' ? 'Odendi' : h.odeme_durumu === 'iptal' ? 'Iptal' : 'Bekliyor',
      h.video_ister ? 'Evet' : 'Hayir', h.aciklama || '-']);
  });

  // Footer
  ws.addRow([]);
  ws.addRow(['Defterdar Muhasebe - CMS Team', '', '', '', '', '', 'Founder: Ismail DEMIRCAN']);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="kurban-' + k.kurban_no + '.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// ─── SİSTEM IP ─────────────────────────────────────────────────────────────

router.get('/sistem/ip', (req, res) => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  res.json({ ips });
});

// ─── KULLANICI AYARLARI ─────────────────────────────────────────────────────

router.get('/ayarlar', async (req, res) => {
  const db = await getDb();
  const ayar = db.prepare('SELECT * FROM ayarlar WHERE kullanici_id=?').get(req.session.userId);
  res.json(ayar || { kurulum_tamamlandi: 0, logo_data: null, bayrak_data: null });
});

router.post('/ayarlar', async (req, res) => {
  const db = await getDb();
  const { logo_data, bayrak_data, kurulum_tamamlandi } = req.body;
  const mevcut = db.prepare('SELECT id FROM ayarlar WHERE kullanici_id=?').get(req.session.userId);
  if (mevcut) {
    db.prepare('UPDATE ayarlar SET logo_data=?, bayrak_data=?, kurulum_tamamlandi=? WHERE kullanici_id=?')
      .run(logo_data || null, bayrak_data || null, kurulum_tamamlandi ? 1 : 0, req.session.userId);
  } else {
    db.prepare('INSERT INTO ayarlar (kullanici_id, logo_data, bayrak_data, kurulum_tamamlandi) VALUES (?,?,?,?)')
      .run(req.session.userId, logo_data || null, bayrak_data || null, kurulum_tamamlandi ? 1 : 0);
  }
  res.json({ ok: true });
});

// ─── ÇÖP KUTUSU ────────────────────────────────────────────────────────────

function copKutusuDetayOlustur(tur, v) {
  const turLabel = { buyukbas: 'Büyükbaş', kucukbas: 'Küçükbaş' };
  if (tur === 'kurban' && v.kurban) {
    const k = v.kurban;
    const hisseler = v.hisseler || [];
    const bagiscilar = hisseler.filter(h => h.bagisci_adi).map(h => ({
      ad: h.bagisci_adi,
      telefon: h.bagisci_telefon || '',
      hisse_no: h.hisse_no,
      kategori: h.bagisci_kategori || '',
      kurban_turu: h.kurban_turu || k.kurban_turu || 'Udhiye'
    }));
    return {
      kurban_no: k.kurban_no,
      hayvan_turu: turLabel[k.tur] || k.tur,
      kurban_turu: k.kurban_turu || 'Udhiye',
      kupe_no: k.kupe_no || '',
      hisse_sayisi: hisseler.length,
      dolu_hisse: bagiscilar.length,
      bagiscilar,
      org_id: k.organizasyon_id
    };
  }
  if (tur === 'organizasyon' && v.org) {
    const kurbanlar = v.kurbanlar || [];
    let toplamBagisci = 0;
    const bagisciOzet = [];
    kurbanlar.forEach(k => {
      const hs = (v.hisselerMap && v.hisselerMap[k.id]) || [];
      hs.filter(h => h.bagisci_adi).forEach(h => {
        toplamBagisci++;
        if (bagisciOzet.length < 8) {
          bagisciOzet.push({
            ad: h.bagisci_adi,
            kurban_no: k.kurban_no,
            hayvan_turu: turLabel[k.tur] || k.tur,
            kurban_turu: h.kurban_turu || k.kurban_turu || 'Udhiye'
          });
        }
      });
    });
    return {
      org_ad: v.org.ad,
      org_yil: v.org.yil,
      kurban_sayisi: kurbanlar.length,
      bagisci_sayisi: toplamBagisci,
      bagisci_ozet: bagisciOzet
    };
  }
  return null;
}

function geriYuklenenBagiscilariTopla(v, tur) {
  const sonuc = [];
  const turLabel = { buyukbas: 'Büyükbaş', kucukbas: 'Küçükbaş' };
  if (tur === 'kurban' && v.kurban) {
    const k = v.kurban;
    (v.hisseler || []).filter(h => h.bagisci_adi).forEach(h => {
      sonuc.push({
        hisse_id: h.id,
        bagisci_adi: h.bagisci_adi,
        bagisci_telefon: h.bagisci_telefon || '',
        bagisci_kategori: h.bagisci_kategori || '',
        kurban_no: k.kurban_no,
        hisse_no: h.hisse_no,
        hayvan_turu: turLabel[k.tur] || k.tur,
        kurban_turu: h.kurban_turu || k.kurban_turu || 'Udhiye',
        org_id: k.organizasyon_id
      });
    });
  } else if (tur === 'organizasyon' && v.org) {
    (v.kurbanlar || []).forEach(k => {
      const hs = (v.hisselerMap && v.hisselerMap[k.id]) || [];
      hs.filter(h => h.bagisci_adi).forEach(h => {
        sonuc.push({
          hisse_id: h.id,
          bagisci_adi: h.bagisci_adi,
          bagisci_telefon: h.bagisci_telefon || '',
          bagisci_kategori: h.bagisci_kategori || '',
          kurban_no: k.kurban_no,
          hisse_no: h.hisse_no,
          hayvan_turu: turLabel[k.tur] || k.tur,
          kurban_turu: h.kurban_turu || k.kurban_turu || 'Udhiye',
          org_id: v.org.id
        });
      });
    });
  }
  return sonuc;
}

const HISSE_GERI_YUKLE_SQL = `INSERT OR IGNORE INTO hisseler (
  id,kurban_id,hisse_no,bagisci_adi,bagisci_telefon,bagisci_kategori,kimin_adina,kimin_adina_telefon,
  odeme_durumu,video_ister,aciklama,kurban_turu,vekalet_onay,vekalet_tarihi,olusturma
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

function hisseGeriYukle(db, h) {
  db.prepare(HISSE_GERI_YUKLE_SQL).run(
    h.id, h.kurban_id, h.hisse_no, h.bagisci_adi || null, h.bagisci_telefon || null,
    h.bagisci_kategori || null, h.kimin_adina || null, h.kimin_adina_telefon || null,
    h.odeme_durumu || 'bekliyor', h.video_ister || 0, h.aciklama || null,
    h.kurban_turu || 'Udhiye', h.vekalet_onay || 0, h.vekalet_tarihi || null, h.olusturma
  );
}

router.get('/cop-kutusu', async (req, res) => {
  const db = await getDb();
  const list = db.prepare('SELECT id, tur, silme_tarihi, veri FROM cop_kutusu ORDER BY silme_tarihi DESC').all();
  const ozet = list.map(item => {
    try {
      const v = JSON.parse(item.veri);
      let baslik = '';
      let ekstra = null;
      let detay = copKutusuDetayOlustur(item.tur, v);
      if (item.tur === 'organizasyon') baslik = v.org ? v.org.ad + ' (' + v.org.yil + ')' : 'Organizasyon';
      else if (item.tur === 'kurban') {
        baslik = v.kurban
          ? 'Kurban #' + v.kurban.kurban_no + ' — ' + (v.kurban.kurban_turu || 'Udhiye')
          : 'Kurban';
      } else if (item.tur === 'medya') {
        const isVideo = v.resource_type === 'video';
        const kb = v.bytes ? Math.round(v.bytes / 1024) : 0;
        const boyut = kb > 1024 ? (kb/1024).toFixed(1) + ' MB' : kb + ' KB';
        baslik = (v.public_id || 'Medya') + (v.format ? '.' + v.format : '') + ' (' + boyut + ')';
        ekstra = { public_id: v.public_id, resource_type: v.resource_type, secure_url: v.secure_url, format: v.format, bytes: v.bytes, isVideo };
      }
      return { id: item.id, tur: item.tur, baslik, silme_tarihi: item.silme_tarihi, ekstra, detay };
    } catch(e) {
      return { id: item.id, tur: item.tur, baslik: '?', silme_tarihi: item.silme_tarihi, ekstra: null, detay: null };
    }
  });
  res.json(ozet);
});

router.post('/cop-kutusu/:id/geri-yukle', async (req, res) => {
  const db = await getDb();
  const item = db.prepare('SELECT * FROM cop_kutusu WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ hata: 'Bulunamadi' });
  try {
    const v = JSON.parse(item.veri);
    let geriYuklenenBagiscilar = [];
    if (item.tur === 'organizasyon') {
      const { org, kurbanlar, hisselerMap } = v;
      const mevcut = db.prepare('SELECT id FROM organizasyonlar WHERE id=?').get(org.id);
      if (!mevcut) {
        db.prepare(`INSERT INTO organizasyonlar (id,ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama,aktif,olusturma)
          VALUES (?,?,?,?,?,?,?,?,?)`).run(org.id, org.ad, org.yil, org.max_kurban, org.buyukbas_hisse_fiyati, org.kucukbas_hisse_fiyati, org.aciklama, org.aktif, org.olusturma);
      }
      kurbanlar.forEach(k => {
        const mk = db.prepare('SELECT id FROM kurbanlar WHERE id=?').get(k.id);
        if (!mk) {
          db.prepare(`INSERT INTO kurbanlar (id,organizasyon_id,kurban_no,tur,kurban_turu,kesen_kisi,kupe_no,alis_fiyati,toplam_hisse,kesildi,kesim_tarihi,aciklama,olusturma)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(k.id, k.organizasyon_id, k.kurban_no, k.tur, k.kurban_turu||'Udhiye', k.kesen_kisi||null, k.kupe_no||null, k.alis_fiyati||0, k.toplam_hisse, k.kesildi||0, k.kesim_tarihi||null, k.aciklama||null, k.olusturma);
          const hisseler = hisselerMap[k.id] || [];
          hisseler.forEach(h => hisseGeriYukle(db, h));
        }
      });
      geriYuklenenBagiscilar = geriYuklenenBagiscilariTopla(v, 'organizasyon');
    } else if (item.tur === 'kurban') {
      const { kurban: k, hisseler } = v;
      const mk = db.prepare('SELECT id FROM kurbanlar WHERE id=?').get(k.id);
      if (!mk) {
        db.prepare(`INSERT INTO kurbanlar (id,organizasyon_id,kurban_no,tur,kurban_turu,kesen_kisi,kupe_no,alis_fiyati,toplam_hisse,kesildi,kesim_tarihi,aciklama,olusturma)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(k.id, k.organizasyon_id, k.kurban_no, k.tur, k.kurban_turu||'Udhiye', k.kesen_kisi||null, k.kupe_no||null, k.alis_fiyati||0, k.toplam_hisse, k.kesildi||0, k.kesim_tarihi||null, k.aciklama||null, k.olusturma);
        hisseler.forEach(h => hisseGeriYukle(db, h));
      }
      geriYuklenenBagiscilar = geriYuklenenBagiscilariTopla(v, 'kurban');
    } else if (item.tur === 'medya') {
      db.prepare('DELETE FROM cop_kutusu WHERE id=?').run(req.params.id);
      return res.status(400).json({ hata: 'Medya dosyaları Cloudinary\'den kalıcı olarak silindiği için geri yüklenemez. Kaydı çöp kutusundan kaldırıldı.' });
    }
    db.prepare('DELETE FROM cop_kutusu WHERE id=?').run(req.params.id);
    res.json({ ok: true, geriYuklenenBagiscilar, tur: item.tur, baslik: item.tur === 'kurban' && v.kurban ? 'Kurban #' + v.kurban.kurban_no : (v.org ? v.org.ad : '') });
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

// Toplu kurban işlemleri (seçili kurbanlar)
router.post('/kurbanlar/toplu-islem', async (req, res) => {
  const db = await getDb();
  const { ids, islem, deger } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ hata: 'Kurban secilmedi' });
  if (!['kesildi', 'vekalet', 'sil'].includes(islem)) return res.status(400).json({ hata: 'Gecersiz islem' });

  let etkilenen = 0;
  const bugun = new Date().toISOString().split('T')[0];

  for (const kid of ids) {
    const k = db.prepare('SELECT * FROM kurbanlar WHERE id=?').get(kid);
    if (!k) continue;

    if (islem === 'kesildi') {
      const kesildi = deger ? 1 : 0;
      db.prepare('UPDATE kurbanlar SET kesildi=?, kesim_tarihi=? WHERE id=?')
        .run(kesildi, kesildi ? bugun : null, kid);
      etkilenen++;
    } else if (islem === 'vekalet') {
      const vekalet = deger ? 1 : 0;
      const vt = vekalet ? new Date().toISOString() : null;
      const r = db.prepare(`UPDATE hisseler SET vekalet_onay=?, vekalet_tarihi=? WHERE kurban_id=? AND bagisci_adi IS NOT NULL`)
        .run(vekalet, vt, kid);
      if (r.changes > 0) etkilenen++;
    } else if (islem === 'sil') {
      const hisseler = db.prepare('SELECT * FROM hisseler WHERE kurban_id=?').all(kid);
      db.prepare('INSERT INTO cop_kutusu (tur, veri) VALUES (?,?)').run('kurban', JSON.stringify({ kurban: k, hisseler }));
      db.prepare('DELETE FROM hisseler WHERE kurban_id=?').run(kid);
      db.prepare('DELETE FROM kurbanlar WHERE id=?').run(kid);
      ['buyukbas', 'kucukbas'].forEach(turAdi => {
        const kalanlar = db.prepare('SELECT id FROM kurbanlar WHERE organizasyon_id=? AND tur=? ORDER BY kurban_no ASC').all(k.organizasyon_id, turAdi);
        kalanlar.forEach((row, idx) => {
          db.prepare('UPDATE kurbanlar SET kurban_no=? WHERE id=?').run(idx + 1, row.id);
        });
      });
      etkilenen++;
    }
  }
  res.json({ ok: true, etkilenen });
});

router.delete('/cop-kutusu/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM cop_kutusu WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.delete('/cop-kutusu', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM cop_kutusu').run();
  res.json({ ok: true });
});

// ─── MEDYA ÇÖP KUTUSU ──────────────────────────────────────────────────────
router.get('/medya-cop', async (req, res) => {
  const db = await getDb();
  try {
    const list = db.prepare('SELECT * FROM medya_cop ORDER BY silme_tarihi DESC LIMIT 200').all();
    res.json(list);
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

router.delete('/medya-cop/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM medya_cop WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.delete('/medya-cop', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM medya_cop').run();
  res.json({ ok: true });
});

// ─── SİSTEM IP ─────────────────────────────────────────────────────────────

router.get('/sistem/ip', (req, res) => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ ip: iface.address, ad: name });
      }
    }
  }
  res.json({ ips });
});


// ─── TAM YEDEK SİSTEMİ ─────────────────────────────────────────────────────

router.get('/tam-yedek', async (req, res) => {
  const db = await getDb();
  try {
    // Tüm verileri topla
    const organizasyonlar = db.prepare('SELECT * FROM organizasyonlar WHERE kullanici_id=?').all(req.session.userId);
    const yedek = {
      versiyon: '1.0',
      tarih: new Date().toISOString(),
      organizasyonlar: []
    };

    // Her organizasyon için kurban ve hisseleri topla
    for (const org of organizasyonlar) {
      const kurbanlar = db.prepare('SELECT * FROM kurbanlar WHERE organizasyon_id=? ORDER BY kurban_no ASC').all(org.id);
      const orgData = { ...org, kurbanlar: [] };
      
      for (const k of kurbanlar) {
        const hisseler = db.prepare('SELECT * FROM hisseler WHERE kurban_id=? ORDER BY hisse_no ASC').all(k.id);
        orgData.kurbanlar.push({ ...k, hisseler });
      }
      
      yedek.organizasyonlar.push(orgData);
    }

    // Kullanıcı ayarlarını ekle (eski tablo)
    const ayarlar = db.prepare('SELECT * FROM kullanici_ayarlar WHERE kullanici_id=?').get(req.session.userId);
    yedek.ayarlar = ayarlar || {};
    
    // Yazdırma ayarlarını ekle (yeni tablo - logo ve bayrak)
    const yazdirmaAyarlari = db.prepare('SELECT logo_data, bayrak_data, icder_sifre FROM ayarlar WHERE kullanici_id=?').get(req.session.userId);
    if (yazdirmaAyarlari) {
      yedek.yazdirma_ayarlari = yazdirmaAyarlari;
    }

    // JSON olarak indir
    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="defterdar-yedek-${tarih}.json"`);
    res.json(yedek);
  } catch(e) {
    res.status(500).json({ hata: e.message });
  }
});

// ─── YEDEK GERİ YÜKLEME ───────────────────────────────────────────────────

const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/yedek-geri-yukle', upload.single('dosya'), async (req, res) => {
  if (!req.file) return res.status(400).json({ hata: 'Dosya bulunamadı' });
  
  try {
    const db = await getDb();
    const yedek = JSON.parse(req.file.buffer.toString('utf8'));

    if (!yedek.versiyon || !yedek.organizasyonlar) {
      return res.status(400).json({ hata: 'Geçersiz yedek dosyası formatı' });
    }

    let istatistik = { 
      organizasyonlar: 0, 
      kurbanlar: 0, 
      hisseler: 0, 
      guncellendi: 0 
    };

    // Her organizasyonu geri yükle
    for (const org of yedek.organizasyonlar) {
      let orgId;
      
      // Organizasyon var mı kontrol et
      const mevcutOrg = db.prepare('SELECT id FROM organizasyonlar WHERE ad=? AND yil=? AND kullanici_id=?')
        .get(org.ad, org.yil, req.session.userId);
      
      if (mevcutOrg) {
        // Güncelle
        orgId = mevcutOrg.id;
        db.prepare(`UPDATE organizasyonlar SET max_kurban=?, buyukbas_hisse_fiyati=?, kucukbas_hisse_fiyati=?, aciklama=?, aktif=? 
          WHERE id=?`)
          .run(org.max_kurban, org.buyukbas_hisse_fiyati, org.kucukbas_hisse_fiyati, org.aciklama, org.aktif ?? 1, orgId);
        istatistik.guncellendi++;
      } else {
        // Yeni oluştur
        const r = db.prepare(`INSERT INTO organizasyonlar (ad, yil, max_kurban, buyukbas_hisse_fiyati, kucukbas_hisse_fiyati, aciklama, aktif, kullanici_id)
          VALUES (?,?,?,?,?,?,?,?)`)
          .run(org.ad, org.yil, org.max_kurban, org.buyukbas_hisse_fiyati, org.kucukbas_hisse_fiyati, org.aciklama, org.aktif ?? 1, req.session.userId);
        orgId = r.lastInsertRowid;
        istatistik.organizasyonlar++;
      }

      // Kurbanları geri yükle
      for (const k of (org.kurbanlar || [])) {
        let kurbanId;
        
        // Kurban var mı kontrol et
        const mevcutKurban = db.prepare('SELECT id FROM kurbanlar WHERE organizasyon_id=? AND kurban_no=?')
          .get(orgId, k.kurban_no);
        
        if (mevcutKurban) {
          // Güncelle
          kurbanId = mevcutKurban.id;
          db.prepare(`UPDATE kurbanlar SET tur=?, kurban_turu=?, kesen_kisi=?, kupe_no=?, alis_fiyati=?, toplam_hisse=?, kesildi=?, kesim_tarihi=?, aciklama=?, kucukbas_sayi=?
            WHERE id=?`)
            .run(k.tur, k.kurban_turu || 'Udhiye', k.kesen_kisi || null, k.kupe_no || null, k.alis_fiyati || 0, 
              k.toplam_hisse, k.kesildi || 0, k.kesim_tarihi || null, k.aciklama || null, k.kucukbas_sayi || 1, kurbanId);
        } else {
          // Yeni oluştur
          const r = db.prepare(`INSERT INTO kurbanlar (organizasyon_id, kurban_no, tur, kurban_turu, kesen_kisi, kupe_no, alis_fiyati, toplam_hisse, kesildi, kesim_tarihi, aciklama, kucukbas_sayi)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
            .run(orgId, k.kurban_no, k.tur, k.kurban_turu || 'Udhiye', k.kesen_kisi || null, k.kupe_no || null, 
              k.alis_fiyati || 0, k.toplam_hisse, k.kesildi || 0, k.kesim_tarihi || null, k.aciklama || null, k.kucukbas_sayi || 1);
          kurbanId = r.lastInsertRowid;
          istatistik.kurbanlar++;
        }

        // Hisseleri geri yükle
        for (const h of (k.hisseler || [])) {
          const mevcutHisse = db.prepare('SELECT id FROM hisseler WHERE kurban_id=? AND hisse_no=?')
            .get(kurbanId, h.hisse_no);
          
          if (mevcutHisse) {
            // Güncelle
            db.prepare(`UPDATE hisseler SET bagisci_adi=?, bagisci_telefon=?, kimin_adina=?, kimin_adina_telefon=?, odeme_durumu=?, video_ister=?, video_url=?, video_public_id=?, aciklama=?
              WHERE id=?`)
              .run(h.bagisci_adi || null, h.bagisci_telefon || null, h.kimin_adina || null, h.kimin_adina_telefon || null,
                h.odeme_durumu || 'bekliyor', h.video_ister || 0, h.video_url || null, h.video_public_id || null, h.aciklama || null, mevcutHisse.id);
          } else {
            // Yeni oluştur
            db.prepare(`INSERT INTO hisseler (kurban_id, hisse_no, bagisci_adi, bagisci_telefon, kimin_adina, kimin_adina_telefon, odeme_durumu, video_ister, video_url, video_public_id, aciklama)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
              .run(kurbanId, h.hisse_no, h.bagisci_adi || null, h.bagisci_telefon || null, h.kimin_adina || null, h.kimin_adina_telefon || null,
                h.odeme_durumu || 'bekliyor', h.video_ister || 0, h.video_url || null, h.video_public_id || null, h.aciklama || null);
            istatistik.hisseler++;
          }
        }
      }
    }

    // Ayarları geri yükle (eski tablo)
    if (yedek.ayarlar && (yedek.ayarlar.logo_data || yedek.ayarlar.bayrak_data)) {
      const mevcutAyar = db.prepare('SELECT id FROM kullanici_ayarlar WHERE kullanici_id=?').get(req.session.userId);
      if (mevcutAyar) {
        db.prepare('UPDATE kullanici_ayarlar SET logo_data=COALESCE(?, logo_data), bayrak_data=COALESCE(?, bayrak_data) WHERE kullanici_id=?')
          .run(yedek.ayarlar.logo_data || null, yedek.ayarlar.bayrak_data || null, req.session.userId);
      } else {
        db.prepare('INSERT INTO kullanici_ayarlar (kullanici_id, logo_data, bayrak_data, kurulum_tamamlandi) VALUES (?,?,?,1)')
          .run(req.session.userId, yedek.ayarlar.logo_data || null, yedek.ayarlar.bayrak_data || null);
      }
    }

    // Yazdırma ayarlarını geri yükle (yeni tablo - logo, bayrak, icder_sifre)
    if (yedek.yazdirma_ayarlari) {
      const mevcutAyar = db.prepare('SELECT id FROM ayarlar WHERE kullanici_id=?').get(req.session.userId);
      if (mevcutAyar) {
        db.prepare('UPDATE ayarlar SET logo_data=COALESCE(?, logo_data), bayrak_data=COALESCE(?, bayrak_data), icder_sifre=COALESCE(?, icder_sifre) WHERE kullanici_id=?')
          .run(yedek.yazdirma_ayarlari.logo_data || null, yedek.yazdirma_ayarlari.bayrak_data || null, yedek.yazdirma_ayarlari.icder_sifre || null, req.session.userId);
      } else {
        db.prepare('INSERT INTO ayarlar (kullanici_id, logo_data, bayrak_data, icder_sifre, kurulum_tamamlandi) VALUES (?,?,?,?,1)')
          .run(req.session.userId, yedek.yazdirma_ayarlari.logo_data || null, yedek.yazdirma_ayarlari.bayrak_data || null, yedek.yazdirma_ayarlari.icder_sifre || null);
      }
    }

    res.json({
      ok: true,
      mesaj: `${istatistik.organizasyonlar} yeni organizasyon, ${istatistik.kurbanlar} yeni kurban, ${istatistik.hisseler} yeni hisse eklendi. ${istatistik.guncellendi} organizasyon güncellendi. ${yedek.yazdirma_ayarlari ? 'Yazdırma ayarları geri yüklendi.' : ''}`,
      detay: istatistik
    });
  } catch(e) {
    res.status(500).json({ hata: 'Yedek dosyası işlenemedi: ' + e.message });
  }
});

// ─── EXCEL'DEN GERİ YÜKLEME ────────────────────────────────────────────────

router.post('/excel-geri-yukle', upload.single('dosya'), async (req, res) => {
  if (!req.file) return res.status(400).json({ hata: 'Dosya bulunamadı' });
  
  try {
    const db = await getDb();
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);

    let istatistik = { 
      organizasyonlar: 0, 
      kurbanlar: 0, 
      hisseler: 0,
      ayarlar: 0
    };

    // Yazdırma Ayarları sayfasını kontrol et
    const wsAyarlar = wb.getWorksheet('Yazdirma Ayarlari');
    if (wsAyarlar) {
      let logoData = null;
      let bayrakData = null;

      wsAyarlar.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Header atla
        const ayar = row.getCell(1).value;
        const veri = row.getCell(2).value;
        
        if (ayar === 'Logo' && veri) logoData = veri;
        if (ayar === 'Bayrak' && veri) bayrakData = veri;
      });

      // Ayarları kaydet
      if (logoData || bayrakData) {
        const mevcutAyar = db.prepare('SELECT id FROM ayarlar WHERE kullanici_id=?').get(req.session.userId);
        if (mevcutAyar) {
          db.prepare('UPDATE ayarlar SET logo_data=COALESCE(?, logo_data), bayrak_data=COALESCE(?, bayrak_data) WHERE kullanici_id=?')
            .run(logoData || null, bayrakData || null, req.session.userId);
        } else {
          db.prepare('INSERT INTO ayarlar (kullanici_id, logo_data, bayrak_data, kurulum_tamamlandi) VALUES (?,?,?,1)')
            .run(req.session.userId, logoData || null, bayrakData || null);
        }
        istatistik.ayarlar = 1;
      }
    }

    res.json({
      ok: true,
      mesaj: `Excel yedek dosyası başarıyla geri yüklendi. ${istatistik.ayarlar ? 'Yazdırma ayarları (logo ve bayrak) geri yüklendi.' : ''}`,
      detay: istatistik
    });
  } catch(e) {
    res.status(500).json({ hata: 'Excel dosyası işlenemedi: ' + e.message });
  }
});

// ─── MEVCUT KURBANA BAĞIŞÇI EKLEME ─────────────────────────────────────────

router.post('/organizasyonlar/:orgId/kurbanlar/:kurbanId/bagiscilar', async (req, res) => {
  const db = await getDb();
  const { kurbanId } = req.params;
  const { bagiscilar } = req.body;
  
  if (!bagiscilar || !Array.isArray(bagiscilar)) {
    return res.status(400).json({ hata: 'Bağışçı listesi gerekli' });
  }

  // Kurbanı kontrol et
  const kurban = db.prepare('SELECT * FROM kurbanlar WHERE id=?').get(kurbanId);
  if (!kurban) {
    return res.status(404).json({ hata: 'Kurban bulunamadı' });
  }

  // Mevcut boş hisseleri al
  const bosHisseler = db.prepare('SELECT * FROM hisseler WHERE kurban_id=? AND bagisci_adi IS NULL ORDER BY hisse_no').all(kurbanId);
  
  if (bosHisseler.length < bagiscilar.length) {
    return res.status(400).json({ hata: `Bu kurbanda sadece ${bosHisseler.length} boş hisse var` });
  }

  // Bağışçıları hisselere ata
  let eklenenSayi = 0;
  for (let i = 0; i < bagiscilar.length && i < bosHisseler.length; i++) {
    const bagisci = bagiscilar[i];
    const hisse = bosHisseler[i];
    
    if (bagisci.bagisci_adi && bagisci.bagisci_telefon) {
      db.prepare(`UPDATE hisseler SET 
        bagisci_adi=?, bagisci_telefon=?, kimin_adina=?, kimin_adina_telefon=?, 
        odeme_durumu=?, video_ister=? 
        WHERE id=?`)
        .run(
          bagisci.bagisci_adi.trim(),
          bagisci.bagisci_telefon.trim(),
          bagisci.kimin_adina || null,
          bagisci.kimin_adina_telefon || null,
          bagisci.odeme_durumu || 'bekliyor',
          bagisci.video_ister ? 1 : 0,
          hisse.id
        );
      eklenenSayi++;
    }
  }

  res.json({ 
    ok: true, 
    eklenen: eklenenSayi,
    mesaj: `${eklenenSayi} bağışçı kurban #${kurban.kurban_no}'a eklendi`
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BAYRAK YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

router.get('/bayraklar', async (req, res) => {
  const db = await getDb();
  try {
    db.exec("CREATE TABLE IF NOT EXISTS bayraklar (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, resim_data TEXT NOT NULL, aktif INTEGER DEFAULT 0, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)");
    res.json(db.prepare('SELECT id, ad, aktif, olusturma FROM bayraklar ORDER BY olusturma DESC').all());
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

router.get('/bayraklar/:id/resim', async (req, res) => {
  const db = await getDb();
  const b = db.prepare('SELECT resim_data FROM bayraklar WHERE id=?').get(req.params.id);
  if (!b) return res.status(404).json({ hata: 'Bulunamadı' });
  res.json({ resim_data: b.resim_data });
});

router.post('/bayraklar', async (req, res) => {
  const db = await getDb();
  const { ad, resim_data } = req.body;
  if (!ad || !resim_data) return res.status(400).json({ hata: 'Ad ve resim zorunlu' });
  const r = db.prepare('INSERT INTO bayraklar (ad, resim_data, aktif) VALUES (?,?,0)').run(ad, resim_data);
  res.json({ ok: true, id: r.lastInsertRowid });
});

router.put('/bayraklar/:id', async (req, res) => {
  const db = await getDb();
  const { ad, resim_data } = req.body;
  if (resim_data) {
    db.prepare('UPDATE bayraklar SET ad=?, resim_data=? WHERE id=?').run(ad, resim_data, req.params.id);
  } else {
    db.prepare('UPDATE bayraklar SET ad=? WHERE id=?').run(ad, req.params.id);
  }
  res.json({ ok: true });
});

router.delete('/bayraklar/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM bayraklar WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERSONEL TAKİP SİSTEMİ
// ═══════════════════════════════════════════════════════════════════════════

const PERSONEL_SIFRE = '5586Persona';

// Personel şifresini DB'den oku (admin değiştirebilir)
async function getPersonelSifre(db) {
  try {
    const row = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='personel_sifre'").get();
    const aktif = db.prepare("SELECT deger FROM sistem_ayarlari WHERE anahtar='personel_sifre_aktif'").get();
    return {
      sifre: row?.deger || PERSONEL_SIFRE,
      aktif: aktif?.deger !== '0'
    };
  } catch(e) { return { sifre: PERSONEL_SIFRE, aktif: true }; }
}

// Personel listesi
router.get('/personeller', async (req, res) => {
  const db = await getDb();
  res.json(db.prepare('SELECT id,ad,soyad,pozisyon,departman,telefon,aktif,ise_baslama,maas FROM personeller ORDER BY ad ASC').all());
});

// Personel ekle
router.post('/personeller', async (req, res) => {
  const db = await getDb();
  const { ad,soyad,tc_no,dogum_tarihi,telefon,email,adres,pozisyon,departman,ise_baslama,maas,iban,banka,acil_kisi,acil_telefon,fotograf,notlar } = req.body;
  if (!ad || !soyad) return res.status(400).json({ hata: 'Ad ve soyad zorunlu' });
  const r = db.prepare('INSERT INTO personeller (ad,soyad,tc_no,dogum_tarihi,telefon,email,adres,pozisyon,departman,ise_baslama,maas,iban,banka,acil_kisi,acil_telefon,fotograf,notlar) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(ad,soyad,tc_no||null,dogum_tarihi||null,telefon||null,email||null,adres||null,pozisyon||null,departman||null,ise_baslama||null,maas||0,iban||null,banka||null,acil_kisi||null,acil_telefon||null,fotograf||null,notlar||null);
  res.json({ ok:true, id:r.lastInsertRowid });
});

// Personel güncelle
router.put('/personeller/:id', async (req, res) => {
  const db = await getDb();
  const { ad,soyad,tc_no,dogum_tarihi,telefon,email,adres,pozisyon,departman,ise_baslama,maas,iban,banka,acil_kisi,acil_telefon,fotograf,notlar,aktif } = req.body;
  db.prepare('UPDATE personeller SET ad=?,soyad=?,tc_no=?,dogum_tarihi=?,telefon=?,email=?,adres=?,pozisyon=?,departman=?,ise_baslama=?,maas=?,iban=?,banka=?,acil_kisi=?,acil_telefon=?,fotograf=?,notlar=?,aktif=? WHERE id=?').run(ad,soyad,tc_no||null,dogum_tarihi||null,telefon||null,email||null,adres||null,pozisyon||null,departman||null,ise_baslama||null,maas||0,iban||null,banka||null,acil_kisi||null,acil_telefon||null,fotograf||null,notlar||null,aktif??1,req.params.id);
  res.json({ ok:true });
});

// Personel sil
router.delete('/personeller/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM personeller WHERE id=?').run(req.params.id);
  db.prepare('DELETE FROM personel_devamsizlik WHERE personel_id=?').run(req.params.id);
  db.prepare('DELETE FROM personel_avans WHERE personel_id=?').run(req.params.id);
  db.prepare('DELETE FROM personel_maas WHERE personel_id=?').run(req.params.id);
  db.prepare('DELETE FROM personel_notlar WHERE personel_id=?').run(req.params.id);
  res.json({ ok:true });
});

// Personel detay (şifre korumalı)
router.post('/personeller/:id/detay', async (req, res) => {
  const { sifre } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  // Şifre koruması aktifse kontrol et
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  const p = db.prepare('SELECT * FROM personeller WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ hata: 'Bulunamadı' });
  const devamsizlik = db.prepare('SELECT * FROM personel_devamsizlik WHERE personel_id=? ORDER BY tarih DESC').all(req.params.id);
  const avanslar = db.prepare('SELECT * FROM personel_avans WHERE personel_id=? ORDER BY tarih DESC').all(req.params.id);
  const maaslar = db.prepare('SELECT * FROM personel_maas WHERE personel_id=? ORDER BY ay DESC').all(req.params.id);
  const notlar = db.prepare('SELECT * FROM personel_notlar WHERE personel_id=? ORDER BY olusturma DESC').all(req.params.id);
  res.json({ personel:p, devamsizlik, avanslar, maaslar, notlar });
});

// Devamsızlık ekle
router.post('/personeller/:id/devamsizlik', async (req, res) => {
  const { sifre, tarih, tur, aciklama } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  const r = db.prepare('INSERT INTO personel_devamsizlik (personel_id,tarih,tur,aciklama) VALUES (?,?,?,?)').run(req.params.id,tarih,tur||'gelmedi',aciklama||null);
  res.json({ ok:true, id:r.lastInsertRowid });
});

router.delete('/personel-devamsizlik/:id', async (req, res) => {
  const { sifre } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  db.prepare('DELETE FROM personel_devamsizlik WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});

// Avans ekle
router.post('/personeller/:id/avans', async (req, res) => {
  const { sifre, miktar, tarih, aciklama } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  const r = db.prepare('INSERT INTO personel_avans (personel_id,miktar,tarih,aciklama) VALUES (?,?,?,?)').run(req.params.id,miktar,tarih,aciklama||null);
  res.json({ ok:true, id:r.lastInsertRowid });
});

router.put('/personel-avans/:id/odendi', async (req, res) => {
  const { sifre } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  db.prepare('UPDATE personel_avans SET odendi=1 WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});

// Maaş ekle
router.post('/personeller/:id/maas', async (req, res) => {
  const { sifre, ay, maas, odendi, odeme_tarihi, aciklama } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  const r = db.prepare('INSERT INTO personel_maas (personel_id,ay,maas,odendi,odeme_tarihi,aciklama) VALUES (?,?,?,?,?,?)').run(req.params.id,ay,maas,odendi?1:0,odeme_tarihi||null,aciklama||null);
  res.json({ ok:true, id:r.lastInsertRowid });
});

router.put('/personel-maas/:id', async (req, res) => {
  const { sifre, odendi, odeme_tarihi } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  db.prepare('UPDATE personel_maas SET odendi=?,odeme_tarihi=? WHERE id=?').run(odendi?1:0,odeme_tarihi||null,req.params.id);
  res.json({ ok:true });
});

// Not ekle
router.post('/personeller/:id/not', async (req, res) => {
  const { sifre, tur, baslik, icerik } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  const r = db.prepare('INSERT INTO personel_notlar (personel_id,tur,baslik,icerik) VALUES (?,?,?,?)').run(req.params.id,tur||'genel',baslik||null,icerik);
  res.json({ ok:true, id:r.lastInsertRowid });
});

router.delete('/personel-not/:id', async (req, res) => {
  const { sifre } = req.body;
  const db = await getDb();
  const ayar = await getPersonelSifre(db);
  if (ayar.aktif && sifre !== ayar.sifre) return res.status(403).json({ hata: 'Yanlış şifre' });
  db.prepare('DELETE FROM personel_notlar WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});

// ═══════════════════════════════════════════════════════════════════════════
// KASA YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

// Kasa hareketleri listesi (filtreli)
router.get('/kasa', async (req, res) => {
  const db = await getDb();
  const { ay, tur, kategori } = req.query;
  let sql = 'SELECT k.*, p.ad||" "||p.soyad as personel_adi, o.ad as org_adi FROM kasa_hareketleri k LEFT JOIN personeller p ON k.personel_id=p.id LEFT JOIN organizasyonlar o ON k.organizasyon_id=o.id WHERE 1=1';
  const params = [];
  if (ay) { sql += ' AND strftime("%Y-%m", k.tarih)=?'; params.push(ay); }
  if (tur) { sql += ' AND k.tur=?'; params.push(tur); }
  if (kategori) { sql += ' AND k.kategori=?'; params.push(kategori); }
  sql += ' ORDER BY k.tarih DESC, k.id DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

// Kasa özeti (ay bazlı)
router.get('/kasa/ozet', async (req, res) => {
  const db = await getDb();
  const { ay } = req.query;
  let where = ay ? `WHERE strftime('%Y-%m', tarih)='${ay}'` : '';
  const giris = db.prepare(`SELECT COALESCE(SUM(tutar),0) as toplam FROM kasa_hareketleri ${where} AND tur='giris'`.replace('WHERE AND', 'WHERE')).get();
  const cikis = db.prepare(`SELECT COALESCE(SUM(tutar),0) as toplam FROM kasa_hareketleri ${where} AND tur='cikis'`.replace('WHERE AND', 'WHERE')).get();
  const maasGider = db.prepare(`SELECT COALESCE(SUM(tutar),0) as toplam FROM kasa_hareketleri ${where} AND tur='cikis' AND kategori='maas'`.replace('WHERE AND', 'WHERE')).get();
  res.json({
    giris: giris.toplam,
    cikis: cikis.toplam,
    net: giris.toplam - cikis.toplam,
    maas_gider: maasGider.toplam
  });
});

// Kasa hareketi ekle
router.post('/kasa', async (req, res) => {
  const db = await getDb();
  const { tarih, tur, kategori, aciklama, tutar, belge_data, belge_adi, personel_id, organizasyon_id } = req.body;
  if (!tarih || !aciklama || !tutar) return res.status(400).json({ hata: 'Tarih, açıklama ve tutar zorunlu' });
  if (!['giris','cikis'].includes(tur)) return res.status(400).json({ hata: 'Geçersiz tür' });
  const r = db.prepare('INSERT INTO kasa_hareketleri (tarih,tur,kategori,aciklama,tutar,belge_data,belge_adi,personel_id,organizasyon_id) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(tarih, tur, kategori||null, aciklama, tutar, belge_data||null, belge_adi||null, personel_id||null, organizasyon_id||null);
  res.json({ ok:true, id:r.lastInsertRowid });
});

// Kasa hareketi sil
router.delete('/kasa/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM kasa_hareketleri WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});

// Personel maaş toplu ödeme (kasa'ya otomatik gider yazar)
router.post('/kasa/maas-ode', async (req, res) => {
  const db = await getDb();
  const { ay, personel_ids } = req.body;
  if (!ay || !personel_ids?.length) return res.status(400).json({ hata: 'Ay ve personel listesi zorunlu' });
  let toplam = 0;
  for (const pid of personel_ids) {
    const p = db.prepare('SELECT * FROM personeller WHERE id=?').get(pid);
    if (!p || !p.maas) continue;
    // Kasa'ya gider yaz
    db.prepare('INSERT INTO kasa_hareketleri (tarih,tur,kategori,aciklama,tutar,personel_id) VALUES (?,?,?,?,?,?)')
      .run(new Date().toISOString().split('T')[0], 'cikis', 'maas', `${p.ad} ${p.soyad} — ${ay} maaşı`, p.maas, p.id);
    // Personel maaş tablosuna da yaz
    db.prepare('INSERT INTO personel_maas (personel_id,ay,maas,odendi,odeme_tarihi) VALUES (?,?,?,1,?)')
      .run(p.id, ay, p.maas, new Date().toISOString().split('T')[0]);
    toplam += p.maas;
  }
  res.json({ ok:true, toplam });
});

// Gider kalemleri
router.get('/kasa/gider-kalemleri', async (req, res) => {
  const db = await getDb();
  res.json(db.prepare('SELECT * FROM kasa_gider_kalemleri WHERE aktif=1 ORDER BY ad ASC').all());
});

router.post('/kasa/gider-kalemleri', async (req, res) => {
  const db = await getDb();
  const { ad, kategori, varsayilan_tutar } = req.body;
  if (!ad) return res.status(400).json({ hata: 'Ad zorunlu' });
  const r = db.prepare('INSERT INTO kasa_gider_kalemleri (ad,kategori,varsayilan_tutar) VALUES (?,?,?)').run(ad, kategori||null, varsayilan_tutar||0);
  res.json({ ok:true, id:r.lastInsertRowid });
});

router.put('/kasa/gider-kalemleri/:id', async (req, res) => {
  const db = await getDb();
  const { ad, kategori, varsayilan_tutar } = req.body;
  db.prepare('UPDATE kasa_gider_kalemleri SET ad=?,kategori=?,varsayilan_tutar=? WHERE id=?').run(ad, kategori||null, varsayilan_tutar||0, req.params.id);
  res.json({ ok:true });
});

router.delete('/kasa/gider-kalemleri/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('UPDATE kasa_gider_kalemleri SET aktif=0 WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});

// Gelir kalemleri
router.get('/kasa/gelir-kalemleri', async (req, res) => {
  const db = await getDb();
  try {
    db.exec("CREATE TABLE IF NOT EXISTS kasa_gelir_kalemleri (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, kategori TEXT, varsayilan_tutar REAL DEFAULT 0, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)");
    res.json(db.prepare('SELECT * FROM kasa_gelir_kalemleri WHERE aktif=1 ORDER BY ad ASC').all());
  } catch(e) { res.status(500).json({ hata: e.message }); }
});

router.post('/kasa/gelir-kalemleri', async (req, res) => {
  const db = await getDb();
  const { ad, kategori, varsayilan_tutar } = req.body;
  if (!ad) return res.status(400).json({ hata: 'Ad zorunlu' });
  const r = db.prepare('INSERT INTO kasa_gelir_kalemleri (ad,kategori,varsayilan_tutar) VALUES (?,?,?)').run(ad, kategori||null, varsayilan_tutar||0);
  res.json({ ok:true, id:r.lastInsertRowid });
});

router.put('/kasa/gelir-kalemleri/:id', async (req, res) => {
  const db = await getDb();
  const { ad, kategori, varsayilan_tutar } = req.body;
  db.prepare('UPDATE kasa_gelir_kalemleri SET ad=?,kategori=?,varsayilan_tutar=? WHERE id=?').run(ad, kategori||null, varsayilan_tutar||0, req.params.id);
  res.json({ ok:true });
});

router.delete('/kasa/gelir-kalemleri/:id', async (req, res) => {
  const db = await getDb();
  db.prepare('UPDATE kasa_gelir_kalemleri SET aktif=0 WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});

module.exports = router;
