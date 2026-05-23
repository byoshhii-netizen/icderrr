# Yedekleme Sistemi - Görseller Dahil

## Versiyon 1.0.2 Yenilikleri

### ✅ Yeni Özellik: Yazdırma Ayarları Yedeği

Artık Excel yedek dosyalarınız yazdırma ayarlarınızı (logo ve bayrak görselleri) da içeriyor!

## Nasıl Çalışır?

### 📥 Yedek Alma (Excel)

Organizasyon Excel yedeği aldığınızda:

1. **Kurbanlar** sayfası - Tüm kurban bilgileri
2. **Bağışçılar** sayfası - Tüm hisse ve bağışçı bilgileri  
3. **Yazdırma Ayarları** sayfası - Logo ve bayrak görselleri (YENİ!)

Yazdırma Ayarları sayfasında:
- Logo verisi (Base64 formatında)
- Bayrak verisi (Base64 formatında)

### 📤 Yedek Geri Yükleme

#### JSON Yedek (Tam Yedek)
- Tüm organizasyonlar, kurbanlar, hisseler
- Kullanıcı ayarları (logo, bayrak)
- Mevcut veriler korunur, yeni veriler eklenir

#### Excel Yedek (Sadece Ayarlar)
- **Yeni Özellik:** Excel dosyasından yazdırma ayarlarını geri yükleyebilirsiniz
- Sadece logo ve bayrak görselleri geri yüklenir
- Organizasyon verileri geri yüklenmez
- Mevcut ayarlarınız varsa üzerine yazılmaz (COALESCE ile korunur)

## Kullanım

### Yedek Alma
1. Organizasyon detay sayfasında "Excel İndir" butonuna tıklayın
2. Excel dosyası otomatik olarak indirilir
3. Dosya içinde "Yazdırma Ayarları" sayfası bulunur

### Yedek Geri Yükleme
1. **Yedek Geri Yükle** menüsüne gidin
2. **Excel Yedekten Ayarları Geri Yükle** kartını kullanın
3. Excel dosyanızı (.xlsx) seçin
4. Onaylayın
5. Logo ve bayrak görselleri otomatik olarak geri yüklenir

## Teknik Detaylar

### Backend (routes.js)

#### Excel Export Endpoint
```javascript
GET /api/organizasyonlar/:orgId/excel
```
- Yazdırma ayarlarını veritabanından çeker
- Yeni "Yazdırma Ayarları" sayfası oluşturur
- Logo ve bayrak verilerini Base64 olarak kaydeder

#### Excel Import Endpoint (YENİ)
```javascript
POST /api/excel-geri-yukle
```
- Excel dosyasını okur
- "Yazdırma Ayarları" sayfasını arar
- Logo ve bayrak verilerini veritabanına kaydeder
- COALESCE kullanarak mevcut verileri korur

### Frontend (app.js)

#### Yeni Fonksiyon
```javascript
async function excelYedekSecildi(input)
```
- Excel dosyası seçimini yönetir
- API'ye gönderir
- Başarı/hata mesajları gösterir
- Ayarları yeniden yükler

### Veritabanı

#### ayarlar Tablosu
```sql
CREATE TABLE ayarlar (
  id INTEGER PRIMARY KEY,
  kullanici_id INTEGER DEFAULT 1,
  logo_data TEXT,           -- Base64 encoded image
  bayrak_data TEXT,         -- Base64 encoded image
  kurulum_tamamlandi INTEGER DEFAULT 0
)
```

## Avantajlar

✅ **Taşınabilirlik:** Excel dosyasıyla birlikte görselleriniz de taşınır
✅ **Yedekleme:** Logo ve bayrak kaybolmaz
✅ **Kolay Geri Yükleme:** Tek tıkla ayarları geri yükleyin
✅ **Güvenli:** Mevcut ayarlar korunur
✅ **Uyumlu:** Eski Excel dosyaları da çalışır (ayarlar sayfası yoksa hata vermez)

## Notlar

- Excel dosyası boyutu artabilir (görseller Base64 formatında)
- Maksimum dosya boyutu: 50MB
- Sadece .xlsx formatı desteklenir
- Logo ve bayrak PNG, JPG, GIF formatlarında olabilir
- Base64 encoding ile görseller metin olarak saklanır

## Güncelleme Geçmişi

### v1.0.2 (Şu Anki Versiyon)
- ✅ Excel yedeklerine yazdırma ayarları eklendi
- ✅ Excel'den ayar geri yükleme özelliği eklendi
- ✅ Yedek Geri Yükle sayfasına Excel seçeneği eklendi

### v1.0.1
- İlk stabil sürüm
- Temel yedekleme sistemi (JSON)
- Excel export (sadece veriler)

---

**İÇDER Kurban Programı** - İÇDER & Defterdar İşbirliği
