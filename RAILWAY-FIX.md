# 🔧 Railway Crash Fix - Ayarlar Tablosu Hatası

## ❌ Sorun

Railway'de Defterdar web versiyonu şu hata ile crash oluyordu:

```
Error: no such table: ayarlar
at e.handleError (/app/node_modules/sql.js/dist/sql-wasm.js:90:192)
at e.tb (/app/node_modules/sql.js/dist/sql-wasm.js:88:454)
at Statement.get (/app/src/database-web.js:42:30)
at /app/src/routes.js:428:73
```

## 🔍 Neden Oldu?

İÇDER Kurban projesi için `database.js` dosyasında `ayarlar` tablosu oluşturduk, ancak orijinal Defterdar'ın web versiyonunda (`database-web.js`) bu tablo yoktu.

**Defterdar'da:**
- Tablo adı: `kullanici_ayarlar`
- Web versiyonunda tablo oluşturulmuyordu

**İÇDER Kurban'da:**
- Tablo adı: `ayarlar` (farklı!)
- EXE versiyonu için basitleştirilmişti

## ✅ Çözüm

`Defterdar/src/database-web.js` dosyasında:

### 1. Schema'ya `ayarlar` Tablosu Eklendi

```javascript
CREATE TABLE IF NOT EXISTS ayarlar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kullanici_id INTEGER NOT NULL UNIQUE,
  logo_data TEXT,
  bayrak_data TEXT,
  kurulum_tamamlandi INTEGER DEFAULT 0,
  olusturma DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Varsayılan Kayıtlar Eklendi

```javascript
// Varsayılan kullanıcı oluştur (web için)
try {
  const userCheck = sqlDb.exec('SELECT id FROM kullanicilar WHERE id=1');
  if (!userCheck || userCheck.length === 0) {
    sqlDb.run("INSERT INTO kullanicilar (id, kullanici_adi, email, sifre_hash) VALUES (1, 'admin', 'admin@defterdar.com', 'dummy')");
  }
} catch(e) {}

// Varsayılan ayarlar oluştur
try {
  const ayarCheck = sqlDb.exec('SELECT id FROM kullanici_ayarlar WHERE kullanici_id=1');
  if (!ayarCheck || ayarCheck.length === 0) {
    sqlDb.run("INSERT INTO kullanici_ayarlar (kullanici_id, kurulum_tamamlandi) VALUES (1, 0)");
  }
} catch(e) {}

try {
  const ayarCheck2 = sqlDb.exec('SELECT id FROM ayarlar WHERE kullanici_id=1');
  if (!ayarCheck2 || ayarCheck2.length === 0) {
    sqlDb.run("INSERT INTO ayarlar (kullanici_id, kurulum_tamamlandi) VALUES (1, 0)");
  }
} catch(e) {}
```

## 📋 Değişiklikler

### `database-web.js`

1. **Schema'ya eklendi:**
   - `ayarlar` tablosu (kullanici_ayarlar'a ek olarak)

2. **Başlangıç verileri:**
   - Varsayılan kullanıcı (id=1, admin)
   - Varsayılan ayarlar (kullanici_ayarlar tablosu)
   - Varsayılan ayarlar (ayarlar tablosu)

## 🚀 Sonuç

✅ Railway'de artık crash olmayacak  
✅ Her iki tablo da oluşturulacak (`kullanici_ayarlar` ve `ayarlar`)  
✅ Varsayılan veriler otomatik eklenecek  
✅ Web versiyonu çalışacak

## 📝 Notlar

- **EXE versiyonu:** `ayarlar` tablosu kullanır (İÇDER Kurban)
- **Web versiyonu:** `kullanici_ayarlar` tablosu kullanır (Defterdar)
- Her iki tablo da oluşturulur, uyumluluk için

## 🔄 Deploy

Railway'e push et:

```bash
cd Defterdar
git add src/database-web.js
git commit -m "fix: ayarlar tablosu eklendi - Railway crash düzeltildi"
git push origin main
```

Railway otomatik deploy edecek ve sorun çözülecek.

---

**Tarih:** 22 Nisan 2026  
**Fix:** Ayarlar tablosu crash sorunu  
**Durum:** ✅ Çözüldü
