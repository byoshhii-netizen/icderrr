# Güncelleme v3.2 - Gelir-Gider Dropdown ve Organizasyon Seç Düzeltmeleri

## 📋 Yapılan Değişiklikler

### 1. ✅ Gelir-Gider Dropdown Eklendi
**Özellik:** Gelir-Gider sayfasına organizasyon seçim dropdown'u eklendi

**Seçenekler:**
- **Tüm Organizasyonlar:** Tüm organizasyonların toplam gelir-giderini gösterir
- **Tek Organizasyon:** Seçili organizasyonun gelir-giderini gösterir

**Nasıl Çalışır:**
- Sayfa açıldığında dropdown üstte görünür
- Varsayılan olarak seçili organizasyon gösterilir (varsa)
- "Tüm Organizasyonlar" seçildiğinde:
  - Tüm organizasyonların kurbanları ve bağışçıları toplanır
  - Toplam gelir, ödenen, bekleyen ve iptal tutarları hesaplanır
  - Tüm organizasyonların istatistikleri birleştirilir
- Tek organizasyon seçildiğinde sadece o organizasyonun verileri gösterilir

**Hesaplama:**
- Her bağışçının hangi organizasyonun kurbanını aldığı tespit edilir
- O kurbanın fiyatı bağışçıya atanır
- Ödeme durumuna göre (ödendi/bekliyor/iptal) kategorize edilir
- Seçime göre tek veya tüm organizasyonlar toplanır

### 2. ✅ Organizasyon Seç Sayfası Düzeltildi
**Sorun:** Organizasyon Seç sayfası boş görünüyordu
**Çözüm:** Toplam gelir hesaplaması için kurbanlar da yükleniyor

**Değişiklikler:**
- Her organizasyon için kurbanlar API'den çekiliyor
- Hisseler ve kurban fiyatları kullanılarak toplam gelir hesaplanıyor
- Artık "Toplam Gelir" kartı doğru değeri gösteriyor

**Gösterilen Bilgiler:**
- Büyükbaş sayısı
- Küçükbaş sayısı
- Toplam bağışçı
- **Toplam gelir** (kurban fiyatları toplamı) ← DÜZELTİLDİ

### 3. ✅ İptal Durumu Hesaplaması Düzeltildi
**Değişiklik:** İptal edilen ödemeler artık doğru hesaplanıyor

**Önceki Durum:**
```javascript
const iptalGelir = toplamGelir - odenenGelir - bekleyenGelir;
```

**Yeni Durum:**
```javascript
if (h.odeme_durumu === 'iptal') {
  iptalGelir += fiyat;
}
```

Artık iptal durumu veritabanından direkt okunuyor ve hesaplanıyor.

## 🎨 Kullanıcı Arayüzü

### Gelir-Gider Sayfası:
```
┌─────────────────────────────────────────┐
│ 🎯 Gelir-Gider                          │
│                                         │
│ [Dropdown: Tüm Organizasyonlar ▼]      │
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ Toplam  │ │ Ödenen  │ │ Bekleyen│   │
│ │ Gelir   │ │         │ │         │   │
│ └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Ödeme Dağılımı                      ││
│ │ Bağışçı | Büyükbaş | Küçükbaş | %  ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Organizasyon Seç Sayfası:
```
┌─────────────────────────────────────────┐
│ 📋 Organizasyon Seç                     │
│                                         │
│ ┌─────────────────┐ ┌─────────────────┐│
│ │ ✓ Kurban 2025   │ │ Kurban 2024     ││
│ │ Seçili          │ │                 ││
│ │                 │ │                 ││
│ │ Büyükbaş: 50    │ │ Büyükbaş: 30    ││
│ │ Küçükbaş: 20    │ │ Küçükbaş: 15    ││
│ │ Bağışçı: 370    │ │ Bağışçı: 220    ││
│ │ Gelir: 750.000₺ │ │ Gelir: 450.000₺ ││
│ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────┘
```

## 📊 Teknik Detaylar

### Frontend (app.js):
- `renderGelirGider()` - Dropdown ile sayfa render
- `gelirGiderOrgDegisti()` - Dropdown değişim handler
- `gelirGiderHesapla()` - Gelir-gider hesaplama (tek veya tüm org)
- `renderOrganizasyonSec()` - Kurbanları da yükleyerek toplam gelir hesaplama

### API Çağrıları:
**Gelir-Gider (Tüm Organizasyonlar):**
```javascript
for (const org of orgs) {
  await api('GET', `/organizasyonlar/${org.id}/istatistik`);
  await api('GET', `/organizasyonlar/${org.id}/hisseler`);
  await api('GET', `/organizasyonlar/${org.id}/kurbanlar`);
}
```

**Gelir-Gider (Tek Organizasyon):**
```javascript
await api('GET', `/organizasyonlar/${orgId}/istatistik`);
await api('GET', `/organizasyonlar/${orgId}/hisseler`);
await api('GET', `/organizasyonlar/${orgId}/kurbanlar`);
```

**Organizasyon Seç:**
```javascript
for (const org of orgs) {
  await api('GET', `/organizasyonlar/${org.id}/istatistik`);
  await api('GET', `/organizasyonlar/${org.id}/kurbanlar`);
  await api('GET', `/organizasyonlar/${org.id}/hisseler`);
}
```

## 🚀 Kullanım Senaryoları

### Tüm Organizasyonların Gelir-Giderini Görme:
1. "Gelir-Gider" sayfasına gidin
2. Dropdown'dan "Tüm Organizasyonlar" seçin
3. Tüm organizasyonların toplam gelir-giderini görün

### Tek Organizasyonun Gelir-Giderini Görme:
1. "Gelir-Gider" sayfasına gidin
2. Dropdown'dan istediğiniz organizasyonu seçin
3. Sadece o organizasyonun gelir-giderini görün

### Organizasyon Seçimi:
1. "Organizasyon Seç" sayfasına gidin
2. Artık tüm organizasyonlar doğru toplam gelir ile gösteriliyor
3. İstediğiniz organizasyona tıklayın

## 📝 Notlar

- Dropdown seçimi sayfa yenilendiğinde korunmaz (her açılışta varsayılan)
- Tüm organizasyonlar seçildiğinde yükleme süresi biraz uzayabilir
- Gelir hesaplaması kurban fiyatlarına göre otomatik yapılır
- İptal durumu artık doğru hesaplanıyor

## 🔄 Önceki Sürümden Farklar

**v3.1 → v3.2:**
- ✅ Gelir-Gider'e dropdown eklendi (Tüm Org / Tek Org)
- ✅ Organizasyon Seç sayfası düzeltildi (toplam gelir gösterimi)
- ✅ İptal durumu hesaplaması düzeltildi
- ✅ API çağrıları optimize edildi

---

**Versiyon**: 3.2  
**Tarih**: 2026-05-03  
**Geliştirici**: İÇDER & Defterdar
