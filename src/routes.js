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
    (SELECT COUNT(*) FROM hisseler h WHERE h.kurban_id=k.id AND h.bagisci_adi IS NOT NULL) as dolu_hisse
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

  const kurban_no = mevcutSayi + 1;
  const toplam_hisse = tur === 'buyukbas' ? 7 : 1;

  const r = db.prepare(`INSERT INTO kurbanlar (organizasyon_id,kurban_no,tur,kupe_no,alis_fiyati,toplam_hisse,aciklama,kurban_turu,kesen_kisi,kucukbas_sayi)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(orgId, kurban_no, tur, kupe_no || null, alis_fiyati || 0, toplam_hisse, aciklama || null, kurban_turu || 'Udhiye', kesen_kisi || null, kucukbas_sayi || 1);

  const kurbanId = r.lastInsertRowid;
  for (let i = 1; i <= toplam_hisse; i++) {
    db.prepare('INSERT INTO hisseler (kurban_id,hisse_no) VALUES (?,?)').run(kurbanId, i);
  }

  res.status(201).json({ id: kurbanId, kurban_no, toplam_hisse });
});

router.put('/kurbanlar/:id', async (req, res) => {
  const db = await getDb();
  const { kupe_no, alis_fiyati, kesildi, kesim_tarihi, aciklama, kurban_turu, kesen_kisi, kucukbas_sayi } = req.body;
  db.prepare(`UPDATE kurbanlar SET kupe_no=?,alis_fiyati=?,kesildi=?,kesim_tarihi=?,aciklama=?,kurban_turu=?,kesen_kisi=?,kucukbas_sayi=? WHERE id=?`)
    .run(kupe_no || null, alis_fiyati || 0, kesildi ? 1 : 0, kesim_tarihi || null, aciklama || null,
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
  res.json({ ok: true });
});

// ─── HİSSELER ──────────────────────────────────────────────────────────────

router.get('/kurbanlar/:kurbanId/hisseler', async (req, res) => {
  const db = await getDb();
  res.json(db.prepare('SELECT * FROM hisseler WHERE kurban_id=? ORDER BY hisse_no').all(req.params.kurbanId));
});

router.put('/hisseler/:id', async (req, res) => {
  const db = await getDb();
  const { bagisci_adi, bagisci_telefon, kimin_adina, kimin_adina_telefon, odeme_durumu, video_ister, aciklama } = req.body;
  db.prepare(`UPDATE hisseler SET bagisci_adi=?,bagisci_telefon=?,kimin_adina=?,kimin_adina_telefon=?,odeme_durumu=?,video_ister=?,aciklama=? WHERE id=?`)
    .run(bagisci_adi || null, bagisci_telefon || null, kimin_adina || null, kimin_adina_telefon || null,
      odeme_durumu || 'bekliyor', video_ister ? 1 : 0, aciklama || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/hisseler/:id/temizle', async (req, res) => {
  const db = await getDb();
  db.prepare(`UPDATE hisseler SET bagisci_adi=NULL,bagisci_telefon=NULL,kimin_adina=NULL,kimin_adina_telefon=NULL,odeme_durumu='bekliyor',video_ister=0,aciklama=NULL WHERE id=?`)
    .run(req.params.id);
  res.json({ ok: true });
});

// ─── BAĞIŞÇI ARAMA ─────────────────────────────────────────────────────────

router.get('/bagiscilar/ara', async (req, res) => {
  const db = await getDb();
  const { q, orgId, tumunu } = req.query;
  let list;
  if (tumunu === '1' && orgId) {
    // Tüm bağışçıları getir (organizasyona göre)
    list = db.prepare(`SELECT h.*, k.kurban_no, k.tur, k.organizasyon_id, k.id as kurban_id FROM hisseler h
      JOIN kurbanlar k ON h.kurban_id=k.id
      WHERE h.bagisci_adi IS NOT NULL AND k.organizasyon_id=?
      ORDER BY k.kurban_no ASC, h.hisse_no ASC LIMIT 500`).all(orgId);
  } else {
    if (!q) return res.json([]);
    const like = `%${q}%`;
    list = db.prepare(`SELECT h.*, k.kurban_no, k.tur, k.organizasyon_id, k.id as kurban_id FROM hisseler h
      JOIN kurbanlar k ON h.kurban_id=k.id
      WHERE h.bagisci_adi IS NOT NULL AND (h.bagisci_adi LIKE ? OR h.bagisci_telefon LIKE ?)
      ORDER BY h.bagisci_adi LIMIT 50`).all(like, like);
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

  const kurban_no = mevcutSayi + 1;
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
      db.prepare(`UPDATE hisseler SET bagisci_adi=?,bagisci_telefon=?,kimin_adina=?,kimin_adina_telefon=?,odeme_durumu=?,video_ister=?,aciklama=? WHERE id=?`)
        .run(h.bagisci_adi.trim(), h.bagisci_telefon||null, h.kimin_adina||null, h.kimin_adina_telefon||null,
          h.odeme_durumu||'bekliyor', h.video_ister?1:0, h.aciklama||null, hisseId);
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

module.exports = router;

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

router.get('/cop-kutusu', async (req, res) => {
  const db = await getDb();
  const list = db.prepare('SELECT id, tur, silme_tarihi, veri FROM cop_kutusu ORDER BY silme_tarihi DESC').all();
  // veri'yi parse et, özet bilgi döndür
  const ozet = list.map(item => {
    try {
      const v = JSON.parse(item.veri);
      let baslik = '';
      if (item.tur === 'organizasyon') baslik = v.org ? v.org.ad + ' (' + v.org.yil + ')' : 'Organizasyon';
      else if (item.tur === 'kurban') baslik = v.kurban ? 'Kurban #' + v.kurban.kurban_no : 'Kurban';
      return { id: item.id, tur: item.tur, baslik, silme_tarihi: item.silme_tarihi };
    } catch(e) { return { id: item.id, tur: item.tur, baslik: '?', silme_tarihi: item.silme_tarihi }; }
  });
  res.json(ozet);
});

router.post('/cop-kutusu/:id/geri-yukle', async (req, res) => {
  const db = await getDb();
  const item = db.prepare('SELECT * FROM cop_kutusu WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ hata: 'Bulunamadi' });
  try {
    const v = JSON.parse(item.veri);
    if (item.tur === 'organizasyon') {
      const { org, kurbanlar, hisselerMap } = v;
      // Organizasyonu geri yükle
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
          hisseler.forEach(h => {
            db.prepare(`INSERT OR IGNORE INTO hisseler (id,kurban_id,hisse_no,bagisci_adi,bagisci_telefon,kimin_adina,kimin_adina_telefon,odeme_durumu,video_ister,aciklama,olusturma)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(h.id, h.kurban_id, h.hisse_no, h.bagisci_adi||null, h.bagisci_telefon||null, h.kimin_adina||null, h.kimin_adina_telefon||null, h.odeme_durumu||'bekliyor', h.video_ister||0, h.aciklama||null, h.olusturma);
          });
        }
      });
    } else if (item.tur === 'kurban') {
      const { kurban: k, hisseler } = v;
      const mk = db.prepare('SELECT id FROM kurbanlar WHERE id=?').get(k.id);
      if (!mk) {
        db.prepare(`INSERT INTO kurbanlar (id,organizasyon_id,kurban_no,tur,kurban_turu,kesen_kisi,kupe_no,alis_fiyati,toplam_hisse,kesildi,kesim_tarihi,aciklama,olusturma)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(k.id, k.organizasyon_id, k.kurban_no, k.tur, k.kurban_turu||'Udhiye', k.kesen_kisi||null, k.kupe_no||null, k.alis_fiyati||0, k.toplam_hisse, k.kesildi||0, k.kesim_tarihi||null, k.aciklama||null, k.olusturma);
        hisseler.forEach(h => {
          db.prepare(`INSERT OR IGNORE INTO hisseler (id,kurban_id,hisse_no,bagisci_adi,bagisci_telefon,kimin_adina,kimin_adina_telefon,odeme_durumu,video_ister,aciklama,olusturma)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(h.id, h.kurban_id, h.hisse_no, h.bagisci_adi||null, h.bagisci_telefon||null, h.kimin_adina||null, h.kimin_adina_telefon||null, h.odeme_durumu||'bekliyor', h.video_ister||0, h.aciklama||null, h.olusturma);
        });
      }
    }
    db.prepare('DELETE FROM cop_kutusu WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ hata: e.message }); }
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
      const kurbanlar = db.prepare('SELECT * FROM kurbanlar WHERE organizasyon_id=?').all(org.id);
      const orgData = { ...org, kurbanlar: [] };
      
      for (const k of kurbanlar) {
        const hisseler = db.prepare('SELECT * FROM hisseler WHERE kurban_id=?').all(k.id);
        orgData.kurbanlar.push({ ...k, hisseler });
      }
      
      yedek.organizasyonlar.push(orgData);
    }

    // Kullanıcı ayarlarını ekle
    const ayarlar = db.prepare('SELECT * FROM kullanici_ayarlar WHERE kullanici_id=?').get(req.session.userId);
    yedek.ayarlar = ayarlar || {};

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

    // Ayarları geri yükle
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

    res.json({
      ok: true,
      mesaj: `${istatistik.organizasyonlar} yeni organizasyon, ${istatistik.kurbanlar} yeni kurban, ${istatistik.hisseler} yeni hisse eklendi. ${istatistik.guncellendi} organizasyon güncellendi.`,
      detay: istatistik
    });
  } catch(e) {
    res.status(500).json({ hata: 'Yedek dosyası işlenemedi: ' + e.message });
  }
});

module.exports = router;
