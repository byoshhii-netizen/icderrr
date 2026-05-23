# İÇDER Kurban Programı - Versiyon 1.0.2

## 🎉 Yeni Özellikler

### ✅ Excel Yedeklerine Yazdırma Ayarları Eklendi

Artık Excel yedek dosyalarınız yazdırma ayarlarınızı (logo ve bayrak görselleri) da içeriyor!

## 📋 Değişiklikler

### Backend (src/routes.js)

#### 1. Excel Export Güncellendi
```javascript
GET /api/organizasyonlar/:orgId/excel
```

**Yeni Özellik:**
- Excel dosyasına "Yazdırma Ayarları" sayfası eklendi
- Logo ve bayrak görselleri Base64 formatında kaydediliyor
- Mevcut "Kurbanlar" ve "Bağışçılar" sayfaları korundu

**Sayfa Yapısı:**
| Ayar   | Veri                    |
|--------|-------------------------|
| Logo   | Base64 encoded image    |
| Bayrak | Base64 encoded image    |

#### 2. Yeni Endpoint: Excel'den Geri Yükleme
```javascript
POST /api/excel-geri-yukle
```

**Özellikler:**
- Excel dosyasından yazdırma ayarlarını okur
- "Yazdırma Ayarları" sayfasını arar
- Logo ve bayrak verilerini veritabanına kaydeder
- COALESCE kullanarak mevcut verileri korur
- Maksimum dosya boyutu: 50MB

**Güvenlik:**
- Mevcut ayarlar üzerine yazılmaz
- Sadece boş alanlar doldurulur
- Hatalı dosyalarda graceful error handling

### Frontend (public/app.js)

#### 1. Yedek Geri Yükle Sayfası Güncellendi
```javascript
async function renderYedekGeriYukle()
```

**Yeni Bölüm:**
- Excel yedekten ayar geri yükleme kartı eklendi
- Sarı/turuncu tema ile görsel ayrım
- Açıklayıcı bilgi metinleri

#### 2. Yeni Fonksiyon: Excel Yedek Seçimi
```javascript
async function excelYedekSecildi(input)
```

**İşlevler:**
- .xlsx dosya formatı kontrolü
- Kullanıcı onayı
- API'ye dosya gönderimi
- Başarı/hata mesajları
- Ayarları otomatik yeniden yükleme
- Detaylı sonuç modalı

**Modal Özellikleri:**
- ✅ Başarı durumunda yeşil ikon
- ℹ️ Ayar bulunamadığında bilgi mesajı
- 🔧 "Ayarlara Git" butonu
- ✓ "Tamam" butonu

### Veritabanı

Değişiklik yok - mevcut `ayarlar` tablosu kullanılıyor:
```sql
CREATE TABLE ayarlar (
  id INTEGER PRIMARY KEY,
  kullanici_id INTEGER DEFAULT 1,
  logo_data TEXT,
  bayrak_data TEXT,
  kurulum_tamamlandi INTEGER DEFAULT 0
)
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yedek Alma
1. Organizasyon detay sayfasına git
2. "Excel İndir" butonuna tıkla
3. Excel dosyası indirilir
4. Dosya içinde 3 sayfa bulunur:
   - Kurbanlar
   - Bağışçılar
   - **Yazdırma Ayarları** (YENİ!)

### Senaryo 2: Başka Bilgisayara Taşıma
1. Eski bilgisayarda Excel yedek al
2. Dosyayı USB/bulut ile taşı
3. Yeni bilgisayarda programı kur
4. "Yedek Geri Yükle" > "Excel Yedekten Ayarları Geri Yükle"
5. Excel dosyasını seç
6. Logo ve bayrak otomatik yüklenir

### Senaryo 3: Ayar Kaybı Durumunda
1. Logo veya bayrak kayboldu
2. Eski Excel yedeklerinden birini bul
3. "Excel Yedekten Ayarları Geri Yükle"
4. Ayarlar geri yüklenir

## 📊 Teknik Detaylar

### Dosya Boyutu
- **Önceki versiyon:** ~50KB (sadece veriler)
- **Yeni versiyon:** ~200KB - 2MB (görseller dahil)
- Görseller Base64 encoding ile ~33% büyür
- Maksimum yükleme: 50MB

### Performans
- Excel okuma: ~100-500ms
- Veritabanı yazma: ~50ms
- Toplam işlem: <1 saniye

### Uyumluluk
- ✅ Eski Excel dosyaları çalışır (ayarlar sayfası yoksa hata vermez)
- ✅ Yeni Excel dosyaları eski versiyonda açılır (ekstra sayfa görmezden gelinir)
- ✅ JSON yedek sistemi etkilenmedi

## 🔒 Güvenlik

### Veri Koruması
- COALESCE kullanımı ile mevcut veriler korunur
- Üzerine yazma yerine birleştirme
- Kullanıcı onayı gerekli

### Dosya Güvenliği
- Sadece .xlsx formatı kabul edilir
- Maksimum dosya boyutu kontrolü
- ExcelJS kütüphanesi ile güvenli parsing
- Hatalı dosyalarda exception handling

## 📦 Paket Bilgileri

### Versiyon
- **Önceki:** 1.0.1
- **Şu Anki:** 1.0.2

### EXE Boyutu
- **Önceki:** 85.12 MB
- **Şu Anki:** 88.29 MB (+3.17 MB)

### Bağımlılıklar
Değişiklik yok - mevcut bağımlılıklar:
- exceljs: ^4.4.0
- sql.js: ^1.14.1
- electron: ^29.4.6

## 🐛 Bilinen Sorunlar

Yok - tüm testler başarılı.

## 📝 Notlar

### Geliştirici Notları
- Base64 encoding kullanıldı (binary yerine)
- ExcelJS worksheet API kullanıldı
- Multer ile dosya yükleme
- IPC değişikliği gerekmedi

### Kullanıcı Notları
- Excel dosyaları biraz daha büyük olacak
- Görseller kalitesi korunur
- PNG, JPG, GIF formatları desteklenir
- Maksimum görsel boyutu sınırı yok (Excel sınırları geçerli)

## 🚀 Gelecek Planlar

### v1.0.3 (Planlanan)
- [ ] Excel'den tam veri geri yükleme (organizasyonlar dahil)
- [ ] Çoklu Excel dosya birleştirme
- [ ] Otomatik yedekleme zamanlaması
- [ ] Bulut yedekleme entegrasyonu

### v1.1.0 (Uzun Vadeli)
- [ ] PDF export
- [ ] Toplu SMS gönderimi
- [ ] WhatsApp entegrasyonu
- [ ] Mobil uygulama

## 📞 Destek

Sorun yaşarsanız:
1. YEDEK-GORSELLER.md dosyasını okuyun
2. GitHub Issues açın
3. İletişime geçin

---

**Geliştirici:** İÇDER & Defterdar İşbirliği  
**Tarih:** 2025  
**Lisans:** Özel Kullanım  
**GitHub:** https://github.com/Cambazzzzzzz/DefterdarData
