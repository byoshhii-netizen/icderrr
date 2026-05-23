# İÇDER Kurban Programı - Kurulum Kılavuzu v2.0

## 🎯 Özellikler

### ✅ Ağ Üzerinden Erişim
- **Aynı WiFi ağındaki tüm cihazlardan erişim**
- Otomatik IP adresi tespiti
- Windows Firewall otomatik yapılandırma
- Port: 4500

### 🔒 Veri Güvenliği
- **Veriler ASLA silinmez**
- Otomatik yedekleme sistemi (her 6 saatte bir)
- 30 günlük yedek geçmişi
- ProgramData klasöründe güvenli saklama
- Güncelleme sonrası veriler korunur

### 📊 Kurban Yönetimi
- Organizasyon yönetimi
- Kurban takibi (Büyükbaş/Küçükbaş)
- Hisse yönetimi
- Bağışçı kayıtları
- Detaylı raporlama
- Excel export

## 📥 Kurulum

### Sistem Gereksinimleri
- Windows 10/11 (64-bit)
- 4 GB RAM (önerilen)
- 500 MB boş disk alanı
- İnternet bağlantısı (kurulum için)

### Kurulum Adımları

1. **Kurulum Dosyasını İndirin**
   - `İÇDER Kurban Programı-Kurulum-2.0.0.exe` dosyasını çalıştırın

2. **Yönetici İzni Verin**
   - Kurulum sırasında yönetici izni isteyecektir
   - Bu, Windows Firewall kuralı eklemek için gereklidir

3. **Kurulum Klasörünü Seçin**
   - Varsayılan: `C:\Program Files\İÇDER Kurban Programı`
   - İsterseniz farklı bir klasör seçebilirsiniz

4. **Kurulumu Tamamlayın**
   - Kurulum otomatik olarak:
     - Programı kurar
     - Windows Firewall kuralı ekler
     - Masaüstü kısayolu oluşturur
     - Başlat menüsüne ekler

## 🚀 İlk Kullanım

### 1. Programı Başlatın
- Masaüstündeki kısayoldan veya Başlat menüsünden açın
- İlk açılışta kurulum sihirbazı gelecektir

### 2. Kurulum Sihirbazı
- **Logo Yükleme**: Organizasyonunuzun logosunu yükleyin
- **Bayrak Yükleme**: Yazdırma için bayrak görseli yükleyin
- Bu adımı atlayıp sonra da yapabilirsiniz

### 3. Ağ Bilgilerini Kontrol Edin
- Program açıldığında sağ üstte ağ bilgileri gösterilir
- Örnek: `http://192.168.1.100:4500`
- Bu adresi aynı WiFi'deki diğer cihazlarda kullanabilirsiniz

## 🌐 Ağ Üzerinden Erişim

### Aynı WiFi'den Bağlanma

1. **Ana Bilgisayarda**
   - Programı normal şekilde açın
   - Splash ekranında veya bildirimde IP adresini görün
   - Örnek: `http://192.168.1.100:4500`

2. **Diğer Cihazlarda**
   - Aynı WiFi ağına bağlanın
   - Web tarayıcısını açın (Chrome, Edge, Firefox)
   - Ana bilgisayarın IP adresini girin
   - Örnek: `http://192.168.1.100:4500`

### IP Adresini Bulma

**Yöntem 1: Program İçinden**
- Program açıldığında otomatik gösterilir
- Ayarlar > Sistem Bilgileri'nden bakabilirsiniz

**Yöntem 2: Windows Komut İstemi**
```cmd
ipconfig
```
- "IPv4 Adresi" satırına bakın
- Örnek: `192.168.1.100`

### Firewall Ayarları

Program otomatik olarak Windows Firewall kuralı ekler:
- **Kural Adı**: İÇDER Kurban 4500
- **Port**: 4500 (TCP)
- **Yön**: Gelen bağlantılar
- **Profil**: Tüm profiller (Özel, Genel, Etki Alanı)

Manuel kontrol için:
1. Windows Güvenlik Duvarı'nı açın
2. Gelişmiş Ayarlar > Gelen Kurallar
3. "İÇDER Kurban 4500" kuralını bulun

## 💾 Veri Yönetimi

### Veritabanı Konumu
```
C:\Users\[KullanıcıAdı]\AppData\Roaming\icder-kurban\data\icder-kurban.db
```

### Otomatik Yedekler
```
C:\Users\[KullanıcıAdı]\AppData\Roaming\icder-kurban\data\yedekler\
```

### Yedekleme Sistemi
- **Otomatik**: Her 6 saatte bir
- **Manuel**: Excel export ile
- **Saklama**: 30 gün
- **Format**: SQLite veritabanı

### Veri Güvenliği
✅ Veriler program güncellemelerinde korunur
✅ Kaldırma sırasında veriler silinmez
✅ Otomatik yedekleme sistemi
✅ Çöp kutusu özelliği (geri yükleme)

## 🔧 Sorun Giderme

### Program Açılmıyor
1. Yönetici olarak çalıştırmayı deneyin
2. Windows Defender'ı kontrol edin
3. Antivirüs yazılımını geçici olarak kapatın

### Ağdan Erişilemiyor
1. **Firewall Kontrolü**
   ```cmd
   netsh advfirewall firewall show rule name="İÇDER Kurban 4500"
   ```

2. **Manuel Firewall Kuralı Ekleme**
   ```cmd
   netsh advfirewall firewall add rule name="İÇDER Kurban 4500" dir=in action=allow protocol=TCP localport=4500
   ```

3. **Ağ Bağlantısı Kontrolü**
   - Aynı WiFi ağında olduğunuzdan emin olun
   - IP adresinin doğru olduğunu kontrol edin
   - Ping testi yapın: `ping 192.168.1.100`

### Port Çakışması
Eğer 4500 portu kullanılıyorsa:
1. Programı kapatın
2. Başka bir program 4500 portunu kullanıyor olabilir
3. O programı kapatın veya portunu değiştirin

### Veritabanı Hatası
1. Program kapalıyken yedek klasörünü kontrol edin
2. En son yedek dosyasını ana klasöre kopyalayın
3. Programı yeniden başlatın

## 📱 Mobil Cihazlardan Erişim

### Android/iOS
1. Aynı WiFi ağına bağlanın
2. Tarayıcıyı açın (Chrome, Safari)
3. IP adresini girin: `http://192.168.1.100:4500`
4. Ana ekrana kısayol ekleyebilirsiniz

### Tablet
- Tam ekran deneyim için tarayıcı ayarlarından "Masaüstü Sitesi" seçeneğini kapatın
- Yatay kullanım önerilir

## 🔄 Güncelleme

### Otomatik Güncelleme
- Program güncellemeleri otomatik kontrol edilir
- Yeni sürüm varsa bildirim gelir

### Manuel Güncelleme
1. Yeni kurulum dosyasını indirin
2. Mevcut programın üzerine kurun
3. Verileriniz otomatik korunur

## 📞 Destek

### Teknik Destek
- **Email**: destek@icder.org.tr
- **Telefon**: [Telefon Numarası]

### Dokümantasyon
- Kullanım kılavuzu program içinde mevcuttur
- Video eğitimler için web sitemizi ziyaret edin

## 📋 Sık Sorulan Sorular

**S: Veriler güvende mi?**
C: Evet, veriler yerel olarak saklanır ve otomatik yedeklenir. Asla silinmez.

**S: İnternet gerekli mi?**
C: Hayır, program tamamen offline çalışır. Sadece aynı WiFi ağı gereklidir.

**S: Kaç cihaz bağlanabilir?**
C: Sınırsız. Aynı WiFi'deki tüm cihazlar erişebilir.

**S: Mobil uygulama var mı?**
C: Hayır, ancak mobil tarayıcılardan tam erişim sağlanabilir.

**S: Verileri nasıl yedeklerim?**
C: Otomatik yedekleme aktif. Manuel için Excel export kullanabilirsiniz.

## 📄 Lisans

© 2025 İÇDER & Defterdar - Tüm hakları saklıdır.

---

**Geliştirici**: CMS Team - İsmail Demircan
**Versiyon**: 2.0.0
**Tarih**: 2025
