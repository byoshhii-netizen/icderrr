# Admin Sistemi ve Destek Hattı - Geliştirme Planı

## 📋 Genel Bakış

Büyük bir admin paneli ve destek sistemi kurulacak. Bu sistem şunları içerecek:

### 1. Destek Hattı Sistemi
- ✅ Kullanıcılar talep açabilir (başlık + içerik)
- ✅ Admin talepler görebilir
- ✅ Admin cevap yazabilir
- ✅ Okundu/Okunmadı durumu
- ✅ Admin talepleri silebilir

### 2. Admin Giriş Sistemi
- ✅ Giriş sayfasında kalkan ikonu (fa-shield)
- ✅ Admin şifresi: BeYA0411
- ✅ Ayrı admin paneli

### 3. Admin Panel Özellikleri
- ✅ Tüm medya depolarını görme
- ✅ İÇDER giriş şifresini değiştirme
- ✅ Admin şifresini değiştirme
- ✅ Tüm organizasyonları görme/yönetme
- ✅ Tüm hisseleri görme/yönetme
- ✅ Destek taleplerini yönetme

### 4. Sistem Modu Yönetimi
- ✅ 3 Mod: Açık / Bakımda / Kapalı
- ✅ Opsiyonel not ekleme
- ✅ Bakımda/Kapalı ise giriş engelleme
- ✅ Notu gösterme

## 📁 Dosya Yapısı

```
Defterdar/
├── public/
│   ├── admin.html          # Admin paneli (YENİ)
│   ├── admin-app.js        # Admin JS (YENİ)
│   ├── icder-giris.html    # Giriş sayfası (GÜNCELLENECEK - kalkan ekle)
│   ├── index.html          # Ana sayfa (GÜNCELLENECEK - destek hattı ekle)
│   └── app.js              # Ana JS (GÜNCELLENECEK - destek fonksiyonları)
├── src/
│   ├── admin-routes.js     # Admin API'leri (YENİ)
│   ├── destek-routes.js    # Destek API'leri (YENİ)
│   ├── auth.js             # Auth (GÜNCELLENECEK - admin girişi ekle)
│   └── database-web.js     # DB (GÜNCELLEND İ - tablolar eklendi)
└── server.js               # Server (GÜNCELLENECEK - yeni route'lar)
```

## 🗄️ Veritabanı Tabloları

### destek_talepleri
```sql
CREATE TABLE destek_talepleri (
  id INTEGER PRIMARY KEY,
  kullanici_id INTEGER,
  baslik TEXT,
  icerik TEXT,
  durum TEXT DEFAULT 'bekliyor',  -- bekliyor, cevaplandi, kapandi
  okundu INTEGER DEFAULT 0,
  admin_cevap TEXT,
  olusturma DATETIME,
  guncelleme DATETIME
);
```

### sistem_ayarlari
```sql
CREATE TABLE sistem_ayarlari (
  id INTEGER PRIMARY KEY,
  anahtar TEXT UNIQUE,
  deger TEXT,
  olusturma DATETIME
);

-- Kayıtlar:
-- sistem_modu: 'acik' | 'bakim' | 'kapali'
-- sistem_notu: 'Bakım mesajı...'
-- admin_sifre: 'BeYA0411'
```

## 🔌 API Endpoint'leri

### Destek Sistemi
- `POST /api/destek/talep-olustur` - Yeni talep
- `GET /api/destek/taleplerim` - Kullanıcının talepleri
- `GET /api/admin/talepler` - Tüm talepler (admin)
- `POST /api/admin/talep-cevapla` - Cevap yaz
- `POST /api/admin/talep-okundu` - Okundu işaretle
- `DELETE /api/admin/talep-sil` - Talebi sil

### Admin Sistemi
- `POST /api/admin/giris` - Admin girişi
- `GET /api/admin/dashboard` - İstatistikler
- `GET /api/admin/organizasyonlar` - Tüm org'lar
- `GET /api/admin/kurbanlar` - Tüm kurbanlar
- `GET /api/admin/medya` - Tüm medya
- `POST /api/admin/sistem-modu` - Mod değiştir
- `POST /api/admin/sifre-degistir` - Şifreleri değiştir

## ⏱️ Tahmini Süre

- Database + API'ler: 30 dakika
- Admin Paneli UI: 45 dakika
- Destek Sistemi UI: 30 dakika
- Test + Debug: 15 dakika
- **TOPLAM: ~2 saat**

## 🚀 Geliştirme Sırası

1. ✅ Database tabloları (TAMAMLANDI)
2. ⏳ API endpoint'leri oluştur
3. ⏳ Admin paneli HTML/JS
4. ⏳ Destek hattı UI
5. ⏳ Giriş sayfasına kalkan ekle
6. ⏳ Sistem modu kontrolü
7. ⏳ Test ve düzeltmeler

## ❓ Kullanıcıya Soru

Bu çok büyük bir sistem. Şu seçeneklerden birini tercih eder misiniz:

**A) Hepsini Şimdi Yap** (2 saat sürer)
- Tüm özellikleri tek seferde eklerim
- Uzun sürer ama tam çalışır sistem

**B) Aşama Aşama Yap** (Her aşama 20-30 dk)
- Önce destek sistemi
- Sonra admin paneli
- Son olarak sistem modu
- Her aşamayı test edebilirsiniz

**C) Sadece Temel Özellikler** (45 dakika)
- Destek talebi açma/görme
- Basit admin paneli
- Sistem modu kontrolü
- Gelişmiş özellikler sonra

Hangisini istersiniz?
