const router = require('express').Router();
const { getDb } = require('./database-web');

// ─── YENİ TALEP OLUŞTUR ─────────────────────────────────────────────────────
router.post('/talep-olustur', async (req, res) => {
  const { baslik, icerik } = req.body;
  if (!baslik || !icerik) {
    return res.status(400).json({ hata: 'Başlık ve içerik gerekli' });
  }

  const kullaniciId = req.session.userId || 1;
  const db = await getDb();
  
  const result = db.prepare(`
    INSERT INTO destek_talepleri (kullanici_id, baslik, icerik, durum, okundu) 
    VALUES (?, ?, ?, 'bekliyor', 0)
  `).run(kullaniciId, baslik, icerik);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

// ─── KULLANICININ TALEPLERİ ─────────────────────────────────────────────────
router.get('/taleplerim', async (req, res) => {
  const kullaniciId = req.session.userId || 1;
  const db = await getDb();
  
  const list = db.prepare(`
    SELECT * FROM destek_talepleri 
    WHERE kullanici_id=? 
    ORDER BY olusturma DESC
  `).all(kullaniciId);
  
  res.json(list);
});

// ─── TALEBİ GÖRÜNTÜLE ───────────────────────────────────────────────────────
router.get('/talep/:id', async (req, res) => {
  const { id } = req.params;
  const kullaniciId = req.session.userId || 1;
  const db = await getDb();
  
  const talep = db.prepare(`
    SELECT * FROM destek_talepleri 
    WHERE id=? AND kullanici_id=?
  `).get(id, kullaniciId);
  
  if (!talep) {
    return res.status(404).json({ hata: 'Talep bulunamadı' });
  }
  
  res.json(talep);
});

module.exports = router;
