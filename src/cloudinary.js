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

// Klasördeki dosyaları listele
router.get('/list', async (req, res) => {
  const folder = req.query.folder || 'defterdar';
  try {
    // Önce search API dene, hata alırsa resources API kullan
    let resources = [];
    try {
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .sort_by('created_at', 'desc')
        .max_results(100)
        .execute();
      resources = result.resources || [];
    } catch(searchErr) {
      // Fallback: resources API
      const [imgResult, vidResult] = await Promise.all([
        cloudinary.api.resources({ type: 'upload', prefix: folder, resource_type: 'image', max_results: 100 }).catch(() => ({ resources: [] })),
        cloudinary.api.resources({ type: 'upload', prefix: folder, resource_type: 'video', max_results: 100 }).catch(() => ({ resources: [] }))
      ]);
      resources = [...(imgResult.resources || []), ...(vidResult.resources || [])];
      resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    res.json(resources);
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
});

module.exports = router;
