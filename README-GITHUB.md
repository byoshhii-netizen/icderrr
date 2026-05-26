# İÇDER Kurban Programı

**İÇDER & Defterdar İşbirliği**

## 📋 Proje Hakkında

İÇDER Kurban Programı, kurban organizasyonlarını yönetmek için geliştirilmiş masaüstü uygulamasıdır. Defterdar Muhasebe programının özelleştirilmiş versiyonudur.

## ✨ Özellikler

### Temel Özellikler
- 🐄 Büyükbaş ve küçükbaş kurban yönetimi
- 👥 Bağışçı takibi ve hisse yönetimi
- 💰 Ödeme durumu takibi
- 📊 Detaylı raporlama
- 🖨️ Profesyonel yazdırma sistemi
- 💾 Excel yedekleme sistemi
- 🎨 Yeşil İslami tema

### Yazdırma Sistemi
- Türk bayrağı + Logo + Destekçi bayrağı
- Yatay A4 formatı
- Sadece logolar (kuruluş ismi yok)
- Bağışçı listesi yazdırma

### Yedekleme Sistemi (v1.0.2)
- ✅ Excel yedekleme (organizasyon bazlı)
- ✅ JSON tam yedek (tüm veriler)
- ✅ Yazdırma ayarları yedeği (logo ve bayrak)
- ✅ Çıkışta zorunlu yedekleme
- ✅ Excel'den ayar geri yükleme

## 🚀 Kurulum

### Gereksinimler
- Windows 10/11
- 200 MB boş disk alanı

### Kurulum Adımları
1. `İÇDER Kurban Programı Setup 1.0.2.exe` dosyasını indirin
2. Kurulum dosyasını çalıştırın
3. Kurulum tamamlandığında program otomatik başlar
4. İlk açılışta logo ve bayrak yükleyin

## 📖 Kullanım

### İlk Kurulum
1. Program açıldığında kurulum sihirbazı gelir
2. Logo yükleyin (yazdırma için)
3. Destekçi bayrağı yükleyin (sağ üst köşe için)
4. "Kaydet ve Başla" butonuna tıklayın

### Organizasyon Oluşturma
1. "Organizasyonlar" menüsüne gidin
2. "Yeni Organizasyon" butonuna tıklayın
3. Bilgileri doldurun (ad, yıl, maksimum kurban sayısı)
4. Kaydedin

### Kurban Ekleme
1. Organizasyon detayına gidin
2. "Yeni Kurban" butonuna tıklayın
3. Hayvan türünü seçin (büyükbaş/küçükbaş)
4. Bilgileri doldurun
5. Kaydedin

### Hisse Satışı
1. Kurban kartına tıklayın
2. Boş hisseye tıklayın
3. Bağışçı bilgilerini girin
4. Ödeme durumunu seçin
5. Kaydedin

### Yedekleme
**Otomatik Yedek (Çıkışta):**
- Program kapatılırken otomatik yedek ister
- Yedek almadan çıkamazsınız
- Excel formatında kaydedilir

**Manuel Yedek:**
- Organizasyon detayında "Excel İndir"
- "Yedek Geri Yükle" menüsünden "Tam Yedek Al"

**Yedek Geri Yükleme:**
- JSON yedek: Tüm veriler
- Excel yedek: Sadece yazdırma ayarları

## 🎨 Tema

### Yeşil İslami Tema
- Ana renk: #10b981 (İslam yeşili)
- Koyu mod varsayılan
- Aydınlık mod seçeneği
- Modern ve temiz arayüz

## 📁 Dosya Yapısı

```
icder-kurban/
├── assets/           # İkonlar ve görseller
├── data/            # Veritabanı (icder-kurban.db)
├── public/          # Frontend dosyaları
│   ├── app.js       # Ana uygulama
│   ├── style.css    # Yeşil tema
│   └── index.html   # Ana sayfa
├── src/             # Backend dosyaları
│   ├── database.js  # Veritabanı (EXE)
│   ├── routes.js    # API endpoint'leri
│   └── auth.js      # Kimlik doğrulama
├── electron.js      # Electron ana dosya
├── server.js        # Express server
└── package.json     # Bağımlılıklar
```

## 🔧 Teknik Detaylar

### Teknolojiler
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Veritabanı:** SQLite (sql.js)
- **Desktop:** Electron
- **Excel:** ExcelJS

### Veritabanı Tabloları
- `kullanicilar` - Kullanıcı bilgileri
- `organizasyonlar` - Organizasyon bilgileri
- `kurbanlar` - Kurban bilgileri
- `hisseler` - Hisse ve bağışçı bilgileri
- `ayarlar` - Logo ve bayrak ayarları
- `cop_kutusu` - Silinen kayıtlar

### Port
- Uygulama: `http://localhost:4500`
- Güvenlik duvarı kuralı otomatik eklenir

## 📊 Versiyon Geçmişi

### v1.0.2 (Güncel)
- ✅ Excel yedeklerine yazdırma ayarları eklendi
- ✅ Excel'den ayar geri yükleme
- ✅ Yedek Geri Yükle sayfası güncellendi

### v1.0.1
- ✅ Yazdırma sistemi güncellendi
- ✅ Yatay A4 formatı
- ✅ Excel butonu eklendi
- ✅ Zorunlu yedekleme sistemi

### v1.0.0
- 🎉 İlk stabil sürüm
- ✅ Temel özellikler
- ✅ Yeşil tema
- ✅ Giriş sistemi kaldırıldı (EXE için)

## 🐛 Bilinen Sorunlar

Şu anda bilinen bir sorun yok.

## 📞 Destek

Sorun yaşarsanız:
- GitHub Issues açın
- Dokümantasyon dosyalarını okuyun:
  - `KURULUM.md` - Kurulum rehberi
  - `YEDEK-GORSELLER.md` - Yedekleme sistemi
  - `GUNCELLEME-v1.0.2.md` - Son güncellemeler

## 📄 Lisans

Bu proje İÇDER ve Defterdar işbirliği ile geliştirilmiştir.  
Özel kullanım için tasarlanmıştır.

## 🤝 Katkıda Bulunanlar

- **İÇDER** - Proje sahibi
- **Defterdar** - Temel yazılım
- **CMS Team** - Geliştirme

## 🔗 Bağlantılar

- **GitHub:** https://github.com/Cambazzzzzzz/DefterdarData
- **Defterdar:** Orijinal muhasebe programı
- **İÇDER:** Kurban organizasyonu

---

**Son Güncelleme:** 2025  
**Versiyon:** 1.0.2  
**Durum:** ✅ Aktif Geliştirme
