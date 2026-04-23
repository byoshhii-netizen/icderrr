# İÇDER Kurban Programı - Versiyon 1.0.3

## 🎉 Yeni Özellikler

### ✅ Yazdırma Yönü Seçim Modalı

Artık "Yazdır" butonuna bastığınızda direkt yazdırma yönünü seçebilirsiniz!

## 📋 Değişiklikler

### Önceki Davranış (v1.0.2)
```
Yazdır butonu → Dropdown menü açılır
  ├─ Yazdır (Yatay)
  └─ Excel İndir
```

### Yeni Davranış (v1.0.3)
```
Yazdır butonu → Modal açılır
  ├─ 📄 Dikey (Portrait)
  └─ 📄 Yatay (Landscape)
```

## 🎨 Modal Özellikleri

### Görsel Tasarım
- 🖨️ Büyük yazıcı ikonu
- Kurban numarası gösterimi
- İki büyük seçim kartı:
  - **Dikey:** Mavi ikon, Portrait A4
  - **Yatay:** Yeşil ikon (90° döndürülmüş), Landscape A4
- Hover efekti (üzerine gelince vurgulama)
- Bilgi mesajı: "Yazdırma penceresi açıldıktan sonra yazıcı ayarlarından da değiştirebilirsiniz"
- İptal butonu

### Kullanıcı Deneyimi
- ✅ Tek tıkla yön seçimi
- ✅ Görsel olarak net ayrım
- ✅ Hızlı erişim
- ✅ Excel indirme kaldırıldı (dropdown menüden)
- ✅ Daha temiz arayüz

## 🔧 Teknik Detaylar

### Frontend Değişiklikleri

#### 1. yazdirKurban() Fonksiyonu Güncellendi
```javascript
// ÖNCE: Direkt yatay yazdırıyordu
async function yazdirKurban(kurbanId, kurbanNo, tur) {
  const html = kurbanYazdirHTML(..., 'landscape');
  printHTML(html);
}

// SONRA: Modal açıyor
async function yazdirKurban(kurbanId, kurbanNo, tur) {
  openModal('Yazdırma Yönü Seçin', `
    <div>Dikey/Yatay seçim kartları</div>
  `);
}
```

#### 2. Yeni Fonksiyon: yazdirKurbanYon()
```javascript
async function yazdirKurbanYon(kurbanId, kurbanNo, tur, orientation) {
  closeModal();
  toast('Yazdırma hazırlanıyor...');
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  const kurbanData = _kurbanlar.find(k => k.id === kurbanId) || {};
  const html = kurbanYazdirHTML(kurbanNo, tur, hisseler, kurbanData, orientation);
  printHTML(html);
}
```

#### 3. Dropdown Menü Güncellendi
```javascript
// ÖNCE
<span>Yazdır (Yatay)</span>

// SONRA
<span>Yazdır</span>
```

### Modal HTML Yapısı
```html
<div style="text-align:center">
  <div>🖨️</div>
  <div>Kurban #X</div>
  <div>Yazdırma yönünü seçin</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr">
  <!-- Dikey Kart -->
  <div onclick="yazdirKurbanYon(..., 'portrait')">
    <i class="fa-solid fa-file-lines"></i>
    <div>Dikey</div>
    <div>Portrait (A4 Dikey)</div>
  </div>
  
  <!-- Yatay Kart -->
  <div onclick="yazdirKurbanYon(..., 'landscape')">
    <i class="fa-solid fa-file" style="transform:rotate(90deg)"></i>
    <div>Yatay</div>
    <div>Landscape (A4 Yatay)</div>
  </div>
</div>

<div>ℹ️ Bilgi mesajı</div>
<button onclick="closeModal()">İptal</button>
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Hızlı Yazdırma
1. Kurban listesinde "Yazdır" butonuna tıkla
2. Modal açılır
3. "Yatay" veya "Dikey" seç
4. Yazdırma penceresi açılır
5. Yazdır

### Senaryo 2: Yön Değiştirme
1. "Yazdır" butonuna tıkla
2. Modal açılır
3. İstediğin yönü seç
4. Yazdırma penceresinde de değiştirebilirsin

### Senaryo 3: İptal Etme
1. "Yazdır" butonuna tıkla
2. Modal açılır
3. "İptal" butonuna tıkla veya modal dışına tıkla
4. Modal kapanır

## 📊 Karşılaştırma

| Özellik | v1.0.2 | v1.0.3 |
|---------|--------|--------|
| Yazdır butonu | Dropdown menü | Modal |
| Yön seçimi | Sadece yatay | Dikey + Yatay |
| Excel indirme | Dropdown'da | Kaldırıldı |
| Kullanıcı adımı | 2 tık | 2 tık |
| Görsel netlik | Orta | Yüksek |
| Esneklik | Düşük | Yüksek |

## 🐛 Düzeltilen Sorunlar

### Sorun 1: Excel İndir Karışıklığı
**Önce:** Yazdır butonunda Excel indirme seçeneği vardı  
**Sonra:** Excel indirme kaldırıldı, sadece yazdırma odaklı

### Sorun 2: Yön Seçimi Eksikliği
**Önce:** Sadece yatay yazdırma  
**Sonra:** Dikey ve yatay seçenekleri

### Sorun 3: Dropdown Karmaşası
**Önce:** "Yazdır (Yatay)" yazısı kafa karıştırıcıydı  
**Sonra:** Sadece "Yazdır" yazıyor, modal içinde seçim

## 📦 Paket Bilgileri

### Versiyon
- **Önceki:** 1.0.2
- **Şu Anki:** 1.0.3

### EXE Boyutu
- **Önceki:** 88.29 MB
- **Şu Anki:** ~88.30 MB (değişiklik yok)

### Bağımlılıklar
Değişiklik yok.

## 🚀 Gelecek Planlar

### v1.0.4 (Planlanan)
- [ ] Yazdırma önizleme
- [ ] Varsayılan yön ayarı
- [ ] Toplu yazdırma
- [ ] PDF kaydetme seçeneği

### v1.1.0 (Uzun Vadeli)
- [ ] Özel yazdırma şablonları
- [ ] QR kod ekleme
- [ ] Barkod yazdırma
- [ ] Çoklu dil desteği

## 📝 Notlar

### Geliştirici Notları
- Modal sistemi mevcut openModal() fonksiyonunu kullanıyor
- Inline onclick kullanıldı (hızlı geliştirme için)
- CSS hover efektleri inline style ile
- Font Awesome ikonları kullanıldı

### Kullanıcı Notları
- Modal kapatmak için "İptal" butonu veya modal dışına tıklayın
- Yazdırma penceresi açıldıktan sonra da yönü değiştirebilirsiniz
- Varsayılan yön artık seçiminize bağlı
- Excel indirme özelliği kaldırılmadı, sadece dropdown'dan çıkarıldı

## 🔄 Geriye Dönük Uyumluluk

✅ Tüm eski özellikler korundu  
✅ Veritabanı değişikliği yok  
✅ API değişikliği yok  
✅ Sadece frontend güncellemesi

## 📞 Destek

Sorun yaşarsanız:
- GitHub Issues açın
- YEDEK-GORSELLER.md dosyasını okuyun
- GUNCELLEME-v1.0.2.md dosyasını okuyun

---

**Geliştirici:** İÇDER & Defterdar İşbirliği  
**Tarih:** 2025  
**Lisans:** Özel Kullanım  
**GitHub:** https://github.com/Cambazzzzzzz/DefterdarData
