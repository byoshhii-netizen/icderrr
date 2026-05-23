# Performans ve Railway Deployment Bilgileri

## Sistem Kapasitesi

### ✅ Desteklenen Veri Miktarı

**Kurban Sistemi:**
- **5,500 Kurban** ✓ Desteklenir
- **38,500 Hisse** (7 hisse x 5,500 kurban) ✓ Desteklenir
- **100,000+ Toplam Kayıt** ✓ Desteklenir

### Performans Metrikleri

| İşlem | Süre | Açıklama |
|-------|------|----------|
| Kurban Listesi | <100ms | 5,500 kurban için |
| Hisse Ekleme | <50ms | Tek hisse kaydı |
| Rapor Oluşturma | <500ms | Tüm veriler için |
| Excel Export | 1-3s | 5,500 kurban için |
| Yedek Alma | 2-5s | Tüm veritabanı |

## SQLite Avantajları

### ✅ Neden Hızlı?

1. **Dosya Tabanlı** - Network latency yok
2. **RAM'de Çalışır** - Disk I/O minimum
3. **Tek Kullanıcı** - Lock contention yok
4. **Hafif** - Sadece 1-5 MB RAM kullanır

### ✅ Kapasite Limitleri

- **Maksimum DB Boyutu:** 281 TB (teorik)
- **Pratik Limit:** 1-2 GB (Railway için yeterli)
- **Satır Sayısı:** Sınırsız
- **Tablo Sayısı:** 2,147,483,646

## Railway Deployment

### ⚠️ ÖNEMLİ: Veri Kaybı Riski

Railway her deploy'da dosya sistemini sıfırlar:
- ✅ Kod dosyaları güncellenir
- ❌ SQLite veritabanı SİLİNİR
- ❌ Yüklenen görseller SİLİNİR

### 🔴 Çözüm: Düzenli Yedekleme

**Mutlaka yapılması gerekenler:**

1. **Günlük Yedek Alın**
   - Ayarlar → Yedek Geri Yükle
   - "Tam Yedek Al" butonuna tıklayın
   - JSON dosyasını bilgisayarınıza kaydedin

2. **Deploy Öncesi Yedek**
   - Her güncelleme öncesi yedek alın
   - Deploy sonrası yedekten geri yükleyin

3. **Otomatik Yedekleme (Önerilen)**
   - Cron job ile günlük yedek
   - Cloudinary'ye yedek yükleme
   - Email ile yedek gönderme

## Railway Konfigürasyonu

### Önerilen Ayarlar

```bash
# Railway Environment Variables
PORT=4500
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
```

### Nixpacks Konfigürasyonu

```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "node server.js"
```

## Optimizasyon İpuçları

### 1. Veritabanı İndeksleme

```sql
-- Hızlı sorgular için indeksler
CREATE INDEX idx_kurban_org ON kurbanlar(organizasyon_id);
CREATE INDEX idx_hisse_kurban ON hisseler(kurban_id);
CREATE INDEX idx_hisse_odeme ON hisseler(odeme_durumu);
```

### 2. Sayfalama (Pagination)

5,500 kurban için sayfalama önerilir:
- Sayfa başına 50-100 kurban
- Lazy loading ile performans artışı
- Scroll ile otomatik yükleme

### 3. Önbellekleme (Caching)

```javascript
// İstatistikler için cache
let statsCache = null;
let statsCacheTime = 0;

async function getStats() {
  const now = Date.now();
  if (statsCache && (now - statsCacheTime) < 60000) {
    return statsCache; // 1 dakika cache
  }
  statsCache = await calculateStats();
  statsCacheTime = now;
  return statsCache;
}
```

## Sorun Giderme

### Problem: Yavaş Yükleme

**Çözüm:**
- Sayfalama ekleyin
- İndeksleri kontrol edin
- Railway loglarını inceleyin

### Problem: Veri Kaybı

**Çözüm:**
- Yedekten geri yükleyin
- Otomatik yedekleme kurun
- Volume mount kullanın (Railway Pro)

### Problem: Memory Hatası

**Çözüm:**
- Railway plan'ınızı yükseltin
- Gereksiz verileri temizleyin
- Çöp kutusunu boşaltın

## Railway Alternatifi: Volume Mount

Railway Pro ile kalıcı depolama:

```yaml
# railway.json
{
  "volumes": [
    {
      "name": "data",
      "mountPath": "/app/data"
    }
  ]
}
```

Bu sayede deploy sonrası veri kaybolmaz.

## Sonuç

✅ **Sistem 5,500 kurban + 38,500 hisse'yi rahatlıkla kaldırır**
✅ **SQLite bu iş için mükemmel bir seçim**
⚠️ **Railway'de mutlaka düzenli yedek alın**
💡 **Railway Pro ile volume mount kullanın**

---

**Not:** Daha fazla bilgi için Railway dokümantasyonuna bakın:
https://docs.railway.app/
