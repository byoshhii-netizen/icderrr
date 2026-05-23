const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const router = require('express').Router();

cloudinary.config({
  cloud_name: 'dguch8d6w',
  api_key: '253232419598976',
  api_secret: 'agZ6arR8iRBS9vFP8tBfKWiTE6Q'
});

// Bellekte tut, disk'e yazma
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/avi'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Yükle
router.post('/upload', upload.single('dosya'), async (req, res) => {
  if (!req.file) return res.status(400).json({ hata: 'Dosya bulunamadi' });
  try {
    const isVideo = req.file.mimetype.startsWith('video/');
    const folder = req.body.folder || 'defterdar';
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideo ? 'video' : 'image',
          public_id: req.body.public_id || undefined,
        },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration || null,
    });
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
});

// Sil
router.delete('/delete', async (req, res) => {
  const { public_id, resource_type, dosya_adi, url } = req.body;
  if (!public_id) return res.status(400).json({ hata: 'public_id gerekli' });
  try {
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: resource_type || 'image' });
    try {
      const { getDb } = process.env.RAILWAY_ENVIRONMENT || process.env.PORT
        ? require('./database-web')
        : require('./database');
      const db = await getDb();
      db.prepare("INSERT INTO medya_cop (dosya_adi, public_id, url, tur) VALUES (?,?,?,?)").run(
        dosya_adi || public_id.split('/').pop() || public_id,
        public_id, url || null,
        resource_type === 'video' ? 'video' : 'resim'
      );
    } catch(e) {}
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
});

// Klasördeki dosyaları listele (alt klasörler dahil)
router.get('/list', async (req, res) => {
  const folder = req.query.folder || 'defterdar';
  try {
    // resources API + prefix kullan: belirtilen klasör ve TÜM alt klasörlerini döner.
    // (search API'nin "folder:" ifadesi alt klasörleri kapsamadığı için hisse/kurban
    //  alt klasörlerine yüklenen medyalar görünmez oluyordu.)
    const fetchAll = async (resource_type) => {
      let all = [];
      let next_cursor = null;
      // Sayfalama: maksimum 5 sayfa (500 dosya)
      for (let i = 0; i < 5; i++) {
        const params = { type: 'upload', prefix: folder, resource_type, max_results: 100 };
        if (next_cursor) params.next_cursor = next_cursor;
        let r;
        try { r = await cloudinary.api.resources(params); } catch(e) { break; }
        all = all.concat(r.resources || []);
        if (!r.next_cursor) break;
        next_cursor = r.next_cursor;
      }
      return all;
    };

    const [images, videos] = await Promise.all([
      fetchAll('image'),
      fetchAll('video'),
    ]);
    const resources = [...images, ...videos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(resources);
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
});

module.exports = router;
