# Yeni Özellikler v2.0 ✨

## 📋 Eklenen Özellikler

### 1. ✅ Tüm Organizasyonlar Görünümü
- **Menü**: Sol sidebar'a "Tüm Organizasyonlar" menü öğesi eklendi
- **Özellik**: Tüm organizasyonların kurban ve bağışçılarını tek sayfada görüntüleme
- **Detaylar**:
  - Her organizasyon için ayrı kart görünümü
  - İstatistikler: Büyükbaş, Küçükbaş, Toplam Bağışçı, Fiyatlar
  - Açılır/kapanır kurban listesi (details/summary)
  - Açılır/kapanır bağışçı listesi
  - Organizasyon seçmeden tüm verileri görüntüleme

### 2. ✅ Bağışçı Gelişmiş Filtreleme
- **Filtreler**:
  - 🔍 **Arama**: Ad veya telefon ile arama
  - 📂 **Kategori**: 8 farklı kategori filtresi
    - Genel Bağışçı
    - VIP Bağışçı
    - Kurumsal
    - Sponsor
    - Düzenli Bağışçı
    - Yeni Bağışçı
    - Eski Bağışçı
    - Özel Kategori
  - 💰 **Ödeme Durumu**: Ödendi / Bekliyor / İptal
  - 🎥 **Video Durumu**: Video İster / İstemez
- **Kullanım**: Kurban filtreleme gibi çoklu filtre desteği
- **Performans**: Client-side filtreleme ile hızlı sonuçlar

### 3. ✅ Yazdırma Font İyileştirmeleri
#### Bağışçı Listesi Yazdırma:
- **Font Boyutu**: 14px → **15px**
- **Font Ağırlığı**: 600 → **900 (bold)**
- **Başlık Fontu**: 14px → **16px bold**
- **Kenarlıklar**: 1px → **2px** (daha belirgin)
- **Tablo Kenarlığı**: 2px solid #000
- **Padding**: Artırıldı (daha okunur)
- **Line Height**: 1.5 → **1.6**

#### Kurban Yazdırma:
- **Başlık Fontu**: 36px → **42px (font-weight: 900)**
- **Tablo Başlık**: 18px → **22px (font-weight: 900)**
- **Hücre Fontu**: 18px → **24px (font-weight: 700)**
- **Satır Yüksekliği**: 42px → **50px**
- **Kenarlıklar**: 1.5px → **2px solid #000**
- **Padding**: Artırıldı
- **Header Border**: 2px → **3px solid**

## 🎨 Görsel İyileştirmeler

### Yazdırma Çıktıları:
- ✅ Daha kalın ve belirgin kenarlıklar
- ✅ Daha büyük ve okunur fontlar
- ✅ Daha fazla padding (hava)
- ✅ Bold/Heavy font ağırlıkları
- ✅ Profesyonel görünüm

## 📊 Teknik Detaylar

### Frontend (app.js):
- `renderTumOrganizasyonlar()` - Yeni sayfa render fonksiyonu
- `filterBagiscilar()` - Gelişmiş filtreleme fonksiyonu
- `_tumBagiscilar` - Global bağışçı cache
- Font iyileştirmeleri `yazdirBagiscilar()` ve `kurbanYazdirHTML()`

### UI/UX:
- Grid layout filtre bar (4 sütun)
- Details/Summary accordion yapısı
- Responsive tasarım
- Loading states

## 🚀 Kullanım

### Tüm Organizasyonlar:
1. Sol menüden "Tüm Organizasyonlar" tıklayın
2. Tüm organizasyonların kartlarını görün
3. Her kartta kurban ve bağışçı listelerini açın

### Bağışçı Filtreleme:
1. Bağışçılar sayfasına gidin
2. Üstteki filtre çubuğunu kullanın:
   - Arama kutusuna ad/telefon yazın
   - Kategori seçin
   - Ödeme durumu seçin
   - Video durumu seçin
3. Filtreler otomatik uygulanır

### Yazdırma:
- Bağışçı listesi ve kurban yazdırma çıktıları artık çok daha okunur
- Kalın fontlar ve belirgin kenarlıklar
- Profesyonel görünüm

## 📝 Notlar

- Tüm özellikler geriye dönük uyumlu
- Mevcut veriler etkilenmez
- Performans optimize edildi
- Mobile responsive

## 🔜 Gelecek Özellikler (Planlanan)

- [x] Admin paneli kategori yönetimi ✅
- [x] Admin paneli filtre yönetimi ✅
- [x] Giriş logosu değiştirme/düzenleme ✅
- [x] Kategori ekleme/silme/düzenleme ✅
- [x] Özel filtre tanımlama ✅

---

## 🆕 Admin Panel Özellikleri (v3.0)

### 4. ✅ Kategori Yönetimi
- **Menü**: Admin Panel → Ayarlar → Kategori Yönetimi
- **Özellikler**:
  - Özel kategori ekleme (Bağışçı, Kurban, Genel)
  - Kategori düzenleme (Ad, Tip, Durum)
  - Kategori silme
  - Aktif/Pasif durumu
  - Kategori tipi seçimi
- **Veritabanı**: `ozel_kategoriler` tablosu
- **API Endpoints**:
  - GET `/api/admin/kategoriler` - Tüm kategorileri listele
  - POST `/api/admin/kategori-ekle` - Yeni kategori ekle
  - PUT `/api/admin/kategori-guncelle/:id` - Kategori güncelle
  - DELETE `/api/admin/kategori-sil/:id` - Kategori sil

### 5. ✅ Filtre Yönetimi
- **Menü**: Admin Panel → Ayarlar → Filtre Yönetimi
- **Özellikler**:
  - Özel filtre ekleme (Bağışçı, Kurban, Ödeme, Video, Genel)
  - Filtre düzenleme (Ad, Tip, Değer, Durum)
  - Filtre silme
  - Aktif/Pasif durumu
  - Filtre değeri tanımlama
- **Veritabanı**: `ozel_filtreler` tablosu
- **API Endpoints**:
  - GET `/api/admin/filtreler` - Tüm filtreleri listele
  - POST `/api/admin/filtre-ekle` - Yeni filtre ekle
  - PUT `/api/admin/filtre-guncelle/:id` - Filtre güncelle
  - DELETE `/api/admin/filtre-sil/:id` - Filtre sil

### 6. ✅ Giriş Logosu Yönetimi
- **Menü**: Admin Panel → Ayarlar → Giriş Logosu
- **Özellikler**:
  - Yeni logo yükleme (PNG, JPG, SVG - Max 2MB)
  - Aktif logo görüntüleme
  - Tüm logoları listeleme
  - Logo aktif/pasif yapma
  - Logo silme
  - Otomatik aktif yapma (yeni logo eklendiğinde)
- **Veritabanı**: `giris_logosu` tablosu
- **API Endpoints**:
  - GET `/api/admin/giris-logosu` - Aktif logoyu getir
  - GET `/api/admin/giris-logolari` - Tüm logoları listele
  - POST `/api/admin/giris-logosu-ekle` - Yeni logo ekle
  - PUT `/api/admin/giris-logosu-guncelle/:id` - Logo güncelle
  - DELETE `/api/admin/giris-logosu-sil/:id` - Logo sil

---

**Versiyon**: 3.0  
**Tarih**: 2026-05-03  
**Geliştirici**: İÇDER & Defterdar
