const router = require('express').Router();
const axios = require('axios');
const { getDb } = process.env.RAILWAY_ENVIRONMENT || process.env.PORT
  ? require('./database-web')
  : require('./database');

const NETGSM_USER = '8503051855';
const NETGSM_PASS = '8bdc#54';
const NETGSM_BASLIK = 'iCDER';

// ─── SMS ŞABLONLARI TABLOSU ────────────────────────────────────────────────
async function ensureSmsTable() {
  const db = await getDb();
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS sms_sablonlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad TEXT NOT NULL,
      icerik TEXT NOT NULL,
      olusturma DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS sms_loglar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alici_adi TEXT,
      telefon TEXT NOT NULL,
      mesaj TEXT NOT NULL,
      durum TEXT DEFAULT 'bekliyor',
      netgsm_kod TEXT,
      gonderim_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS sms_ayarlar (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      netgsm_user TEXT,
      netgsm_pass TEXT,
      netgsm_baslik TEXT DEFAULT 'iCDER'
    )`);
    // Varsayılan satır ekle (yoksa)
    db.exec(`INSERT OR IGNORE INTO sms_ayarlar (id, netgsm_user, netgsm_pass, netgsm_baslik)
             VALUES (1, '${NETGSM_USER}', '${NETGSM_PASS}', '${NETGSM_BASLIK}')`);
  } catch(e) {}
}

async function getSmsAyarlar() {
  const db = await getDb();
  await ensureSmsTable();
  const row = db.prepare('SELECT * FROM sms_ayarlar WHERE id=1').get();
  return {
    netgsm_user: row?.netgsm_user || NETGSM_USER,
    netgsm_pass: row?.netgsm_pass || NETGSM_PASS,
    netgsm_baslik: row?.netgsm_baslik || NETGSM_BASLIK
  };
}

// ─── SMS AYARLARI ──────────────────────────────────────────────────────────
router.get('/sms/ayarlar', async (req, res) => {
  await ensureSmsTable();
  const ayarlar = await getSmsAyarlar();
  // Şifreyi maskele
  res.json({ ...ayarlar, netgsm_pass: ayarlar.netgsm_pass ? '••••••••' : '' });
});

router.post('/sms/ayarlar', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  const { netgsm_user, netgsm_pass, netgsm_baslik } = req.body;
  if (!netgsm_user || !netgsm_pass) return res.status(400).json({ hata: 'Kullanıcı adı ve şifre zorunlu' });
  db.prepare('UPDATE sms_ayarlar SET netgsm_user=?, netgsm_pass=?, netgsm_baslik=? WHERE id=1')
    .run(netgsm_user, netgsm_pass, netgsm_baslik || 'iCDER');
  res.json({ ok: true });
});

router.post('/sms/test-baglanti', async (req, res) => {
  await ensureSmsTable();
  const ayarlar = await getSmsAyarlar();
  try {
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>${ayarlar.netgsm_user}</usercode>
    <password>${ayarlar.netgsm_pass}</password>
    <type>1:n</type>
    <msgheader>${ayarlar.netgsm_baslik}</msgheader>
  </header>
  <body>
    <msg><![CDATA[Test]]></msg>
    <no>905000000000</no>
  </body>
</mainbody>`;
    const response = await axios.post(
      'https://api.netgsm.com.tr/sms/send/xml',
      xmlBody,
      { headers: { 'Content-Type': 'text/xml' }, timeout: 10000 }
    );
    const kod = (response.data || '').toString().trim().split(' ')[0];
    // 00=başarılı, 20=mesaj metni hatalı (ama bağlantı var), diğerleri auth hatası
    if (kod === '00' || kod === '20') {
      res.json({ ok: true, kod });
    } else {
      const hatalar = { '30': 'Geçersiz kullanıcı adı veya şifre', '40': 'Mesaj başlığı onaylı değil', '70': 'Hatalı sorgulama' };
      res.json({ ok: false, kod, hata: hatalar[kod] || 'Netgsm hata kodu: ' + kod });
    }
  } catch(e) {
    res.json({ ok: false, hata: e.message });
  }
});

// ─── ŞABLONLAR ─────────────────────────────────────────────────────────────
router.get('/sms/sablonlar', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  res.json(db.prepare('SELECT * FROM sms_sablonlar ORDER BY olusturma DESC').all());
});

router.post('/sms/sablonlar', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  const { ad, icerik } = req.body;
  if (!ad || !icerik) return res.status(400).json({ hata: 'Ad ve içerik zorunlu' });
  const r = db.prepare('INSERT INTO sms_sablonlar (ad, icerik) VALUES (?,?)').run(ad, icerik);
  res.json({ id: r.lastInsertRowid, ok: true });
});

router.put('/sms/sablonlar/:id', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  const { ad, icerik } = req.body;
  db.prepare('UPDATE sms_sablonlar SET ad=?, icerik=? WHERE id=?').run(ad, icerik, req.params.id);
  res.json({ ok: true });
});

router.delete('/sms/sablonlar/:id', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  db.prepare('DELETE FROM sms_sablonlar WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── SMS GÖNDER ────────────────────────────────────────────────────────────
router.post('/sms/gonder', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  const { mesajlar, baslik } = req.body;
  if (!mesajlar || !mesajlar.length) return res.status(400).json({ hata: 'Mesaj listesi boş' });

  const ayarlar = await getSmsAyarlar();
  const gonderici = baslik || ayarlar.netgsm_baslik;
  const sonuclar = [];

  for (const m of mesajlar) {
    const tel = (m.telefon || '').replace(/\D/g, '');
    // +905xx → 905xx, 05xx → 905xx, 5xx → 905xx
    const telTemiz = tel.startsWith('90') ? tel : tel.startsWith('0') ? '9' + tel : '90' + tel;
    if (!telTemiz || telTemiz.length < 11 || telTemiz.length > 13) {
      sonuclar.push({ telefon: m.telefon, ad: m.ad, durum: 'hata', hata: 'Geçersiz telefon' });
      continue;
    }

    try {
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>${ayarlar.netgsm_user}</usercode>
    <password>${ayarlar.netgsm_pass}</password>
    <type>1:n</type>
    <msgheader>${gonderici}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${m.mesaj}]]></msg>
    <no>${telTemiz}</no>
  </body>
</mainbody>`;

      const response = await axios.post(
        'https://api.netgsm.com.tr/sms/send/xml',
        xmlBody,
        { headers: { 'Content-Type': 'text/xml' }, timeout: 15000 }
      );

      const yanit = (response.data || '').toString().trim();
      const kod = yanit.split(' ')[0];
      // Netgsm: '00' = başarılı, diğerleri hata
      const basarili = kod === '00';
      const durum = basarili ? 'gonderildi' : 'hata';

      db.prepare('INSERT INTO sms_loglar (alici_adi, telefon, mesaj, durum, netgsm_kod) VALUES (?,?,?,?,?)')
        .run(m.ad || null, telTemiz, m.mesaj, durum, kod);

      sonuclar.push({ telefon: m.telefon, ad: m.ad, durum, kod, yanit: response.data });
    } catch(e) {
      db.prepare('INSERT INTO sms_loglar (alici_adi, telefon, mesaj, durum, netgsm_kod) VALUES (?,?,?,?,?)')
        .run(m.ad || null, telTemiz, m.mesaj, 'hata', e.message);
      sonuclar.push({ telefon: m.telefon, ad: m.ad, durum: 'hata', hata: e.message });
    }
  }

  const basarili = sonuclar.filter(s => s.durum === 'gonderildi').length;
  const hatali = sonuclar.filter(s => s.durum === 'hata').length;
  res.json({ ok: true, basarili, hatali, sonuclar });
});

// ─── SMS LOGLAR ────────────────────────────────────────────────────────────
router.get('/sms/loglar', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  res.json(db.prepare('SELECT * FROM sms_loglar ORDER BY gonderim_tarihi DESC LIMIT 200').all());
});

router.delete('/sms/loglar', async (req, res) => {
  await ensureSmsTable();
  const db = await getDb();
  db.prepare('DELETE FROM sms_loglar').run();
  res.json({ ok: true });
});

module.exports = router;
