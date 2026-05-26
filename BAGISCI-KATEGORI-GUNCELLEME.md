# Bağışçı Kategorileme Sistemi Eklendi ✅

## Yapılan Değişiklikler

### 1. Frontend (app.js)
- ✅ **Kategori Listesi Eklendi**: Kurban türleri gibi bağışçı kategorileri tanımlandı
  - Genel Bağışçı
  - VIP Bağışçı
  - Kurumsal
  - Sponsor
  - Düzenli Bağışçı
  - Yeni Bağışçı
  - Eski Bağışçı
  - Özel Kategori

- ✅ **Bağışçı Listesi Tablosu**: Kategori sütunu eklendi
- ✅ **Bağışçı Ekleme Formu**: Her hisse için kategori seçimi eklendi
- ✅ **Bağışçı Düzenleme Formu**: Kategori düzenleme özelliği eklendi
- ✅ **Yazdırma Fonksiyonu**: 
  - Kategori sütunu yazdırma çıktısına eklendi
  - Yazı fontu boyutu 13px → 14px (daha okunur)
  - Satır yüksekliği artırıldı (padding: 8px → 9px)
  - Başlık fontu 13px → 14px

### 2. Backend (routes.js)
- ✅ **Hisse Güncelleme**: `bagisci_kategori` alanı eklendi
- ✅ **Hisse Temizleme**: Kategori varsayılan değere sıfırlanıyor
- ✅ **Kurban ve Hisse Oluşturma**: Kategori bilgisi kaydediliyor

### 3. Veritabanı
- ✅ **database.js**: `hisseler` tablosuna `bagisci_kategori` sütunu eklendi
- ✅ **database-web.js**: Web versiyonu için de sütun eklendi
- ✅ **Migration Script**: Mevcut veritabanlarına sütun eklemek için script oluşturuldu ve çalıştırıldı

## Kullanım

### Bağışçı Eklerken
1. Kurban oluştururken her hisse için kategori seçebilirsiniz
2. Varsayılan kategori: "Genel Bağışçı"

### Bağışçı Düzenlerken
1. Bağışçı listesinde düzenle butonuna tıklayın
2. Kategori dropdown'ından istediğiniz kategoriyi seçin
3. Kaydet

### Yazdırırken
- Bağışçı listesi yazdırıldığında kategori bilgisi de görünür
- Yazı boyutu artırıldı (daha okunur)
- Tablo başlıkları: #, Bağışçı Adı, Telefon, **Kategori**, Kimin Adına, Kurban No, Hisse, Tür, Ödeme, Video

## Teknik Detaylar

### Veritabanı Şeması
```sql
ALTER TABLE hisseler ADD COLUMN bagisci_kategori TEXT DEFAULT 'Genel Bağışçı';
```

### API Değişiklikleri
- `PUT /api/hisseler/:id` - bagisci_kategori parametresi eklendi
- `POST /api/organizasyonlar/:orgId/kurban-ve-hisseler` - hisseler array'inde bagisci_kategori destekleniyor

## Test Edildi ✅
- Migration scripti başarıyla çalıştırıldı
- Veritabanına sütun eklendi
- Varsayılan değer: 'Genel Bağışçı'

## Notlar
- Mevcut bağışçılar için kategori otomatik olarak "Genel Bağışçı" olarak ayarlanır
- Kategori listesi ileride ihtiyaca göre genişletilebilir
- Yazdırma çıktısı A4 boyutuna optimize edilmiştir
