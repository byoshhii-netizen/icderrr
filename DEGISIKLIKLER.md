# İÇDER Kurban Programı - Değişiklik Listesi

## Defterdar'dan Farklılıklar

### 🎨 Görsel Değişiklikler
1. **Tema**: Mavi temadan yeşil İslami temaya geçildi
   - Ana renk: `#10b981` (yeşil)
   - Arka plan: Yeşil tonları
   - Vurgular: Yeşil gradyanlar

2. **Logo**: İçder logosu eklendi
   - `assets/icon.ico`: İçder logosu
   - Uygulama ikonu: İçder logosu

3. **Başlık**: "Defterdar Muhasebe" → "İÇDER Kurban Programı"

### 🔐 Güvenlik Değişiklikleri
1. **Giriş Sistemi Kaldırıldı** (EXE için)
   - Kullanıcı adı/şifre yok
   - Direkt uygulama açılır
   - `_kullaniciAdi = 'İÇDER'` sabit

### 📄 Yazdırma Değişiklikleri
1. **Kuruluş İsmi Kaldırıldı**
   - Kurban yazdır: Sadece logolar (Türk bayrağı + logo + destekçi bayrağı)
   - Bağışçı listesi: Sadece sol üst logo
   - Footer: Sadece "İÇDER" yazısı

2. **Yazdırma Menüsü**
   - Direkt menü açılır (kutucuk yok)
   - Yatay/dikey seçimi modal ile

### 💾 Yedekleme Sistemi
1. **Çıkışta Zorunlu Yedek**
   - Uygulama kapatılırken yedek alınması zorunlu
   - Yedek almadan çıkış yapılamaz
   - Excel formatında yedekleme

### 📁 Dosya Adları
- Veritabanı: `defterdar.db` → `icder-kurban.db`
- Yedek dosyaları: `defterdar-yedek-*` → `icder-kurban-yedek-*`
- Excel raporları: `defterdar-rapor.xlsx` → `icder-kurban-rapor.xlsx`
- LocalStorage: `defterdar-tema` → `icder-kurban-tema`

### 🏢 Branding
- Uygulama adı: "İÇDER Kurban Programı"
- İşbirliği: "İÇDER & Defterdar"
- Lisans: "İÇDER © 2025"
- Footer: "İÇDER & Defterdar İşbirliği"

### 🔧 Teknik Değişiklikler
- `package.json`: Uygulama adı ve açıklaması güncellendi
- `electron.js`: Pencere başlığı ve güvenlik duvarı kuralı güncellendi
- `app.js`: Auth kontrolü kaldırıldı, yazdırma fonksiyonları düzenlendi
- `style.css`: Yeşil tema renkleri uygulandı

## Korunan Özellikler
- ✅ Tüm Defterdar özellikleri korundu
- ✅ Organizasyon yönetimi
- ✅ Kurban ve hisse takibi
- ✅ Bağışçı yönetimi
- ✅ Raporlama sistemi
- ✅ Excel export
- ✅ Medya deposu
- ✅ Çöp kutusu
- ✅ Denetim masası

## Site Versiyonu
Site versiyonu için Defterdar'ın aynısı kullanılacak, sadece EXE versiyonu İçder Kurban Programı olarak özelleştirildi.
