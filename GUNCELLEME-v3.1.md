# Güncelleme v3.1 - Yazdırma, Organizasyon Seç ve Gelir-Gider

## 📋 Yapılan Değişiklikler

### 1. ✅ Yazdırma Fontları Eski Haline Çekildi
**Kurban Yazdırma:**
- Font boyutu: 24px → **18px** (eski haline)
- Font ağırlığı: 900 → **700** (eski haline)
- Satır yüksekliği: 50px → **42px**
- Kenarlıklar: 2px → **1.5px**
- Başlık: 42px → **36px**
- Tablo başlıkları: 22px → **18px**

**Bağışçı Listesi Yazdırma:**
- Font boyutu: 15px → **13px** (eski haline)
- Font ağırlığı: 600 → **500** (eski haline)
- Başlık: 16px → **13px**
- Padding: azaltıldı

### 2. ✅ Organizasyon Seç Sayfası
**Menü:** Sol sidebar → "Organizasyon Seç" (Genel bölümü, ilk sırada)

**Özellikler:**
- Tüm organizasyonları kart görünümünde listeler
- Her kart için istatistikler:
  - Büyükbaş sayısı
  - Küçükbaş sayısı
  - Toplam bağışçı
  - Toplam gelir
- Seçili organizasyon mavi kenarlık ve "Seçili" badge ile işaretlenir
- Karta tıklayarak organizasyon seçimi yapılır
- Seçim sonrası otomatik olarak Kurbanlar sayfasına yönlendirir

**Kullanım:**
1. Sol menüden "Organizasyon Seç" tıklayın
2. İstediğiniz organizasyonun kartına tıklayın
3. Otomatik olarak seçilir ve Kurbanlar sayfasına gider

### 3. ✅ Gelir-Gider Sayfası
**Menü:** Sol sidebar → "Gelir-Gider" (Genel bölümü)

**Özellikler:**
- **Toplam Gelir:** Tüm bağışçılardan beklenen toplam gelir (kurban fiyatları toplamı)
- **Ödenen:** Tahsil edilen ödemeler
- **Bekleyen:** Henüz ödenmemiş tutarlar
- **İptal:** İptal edilen ödemeler
- **İstatistikler:**
  - Toplam bağışçı sayısı
  - Büyükbaş sayısı
  - Küçükbaş sayısı
  - Tahsilat oranı (%)

**Hesaplama:**
- Her bağışçının hangi organizasyonun kurbanını aldığı tespit edilir
- O kurbanın fiyatı bağışçıya atanır
- Ödeme durumuna göre (ödendi/bekliyor/iptal) kategorize edilir
- Toplam gelir ve dağılım gösterilir

**Görsel:**
- Renkli kartlar (yeşil: gelir, mavi: ödenen, sarı: bekleyen, kırmızı: iptal)
- İkonlar ve grafiksel gösterim
- Yüzdelik tahsilat oranı

### 4. ✅ Bağışçı Tablosunda Fiyat Gösterimi
**Değişiklik:** Bağışçılar sayfasındaki tabloya "Fiyat" sütunu eklendi

**Özellikler:**
- Her bağışçının aldığı kurbanın fiyatı gösterilir
- Fiyat yeşil renkte ve kalın yazı ile vurgulanır
- Format: "15.000 ₺" (Türk Lirası sembolü ile)
- Kurban bulunamazsa 0 ₺ gösterir

**Tablo Sırası:**
1. #
2. Bağışçı Adı
3. Telefon
4. Kategori
5. Kimin Adına
6. Kurban No
7. Hisse
8. Tür
9. **Fiyat** ← YENİ
10. Ödeme
11. Video
12. İşlem

## 🎨 Menü Yapısı (Güncel)

```
Genel
├── Organizasyon Seç ← YENİ
├── Tüm Organizasyonlar
├── Gelir-Gider ← YENİ
└── Organizasyon
    ├── Kurban Organizasyonu
    ├── Su Kuyusu Organizasyonu
    ├── Proje Yönetimi
    └── Diğer Organizasyonlar

Kurban Yönetimi
├── Kurbanlar
└── Bağışçılar (Fiyat sütunu eklendi)
```

## 📊 Teknik Detaylar

### Frontend (app.js):
- `renderOrganizasyonSec()` - Organizasyon seçim sayfası
- `selectOrganizasyon(id, ad, yil)` - Organizasyon seçme fonksiyonu
- `renderGelirGider()` - Gelir-gider sayfası
- `formatMoney(amount)` - Para formatı (TL)
- `renderBagisciTablosu()` - Fiyat sütunu eklendi
- `kurbanYazdirHTML()` - Font boyutları eski haline
- `yazdirBagiscilar()` - Font boyutları eski haline

### UI/UX:
- Kart tabanlı organizasyon seçimi
- Renkli gelir-gider kartları
- İstatistiksel gösterimler
- Responsive tasarım
- Yeşil vurgulu fiyat gösterimi

## 🚀 Kullanım Senaryoları

### Organizasyon Seçimi:
1. "Organizasyon Seç" sayfasına gidin
2. İstediğiniz organizasyonu seçin
3. Otomatik olarak kurbanlar sayfasına yönlendirilirsiniz

### Gelir Takibi:
1. Bir organizasyon seçin
2. "Gelir-Gider" sayfasına gidin
3. Toplam gelir, ödenen, bekleyen ve iptal tutarlarını görün
4. Tahsilat oranını kontrol edin

### Bağışçı Fiyat Kontrolü:
1. Bağışçılar sayfasına gidin
2. Tabloda her bağışçının kurban fiyatını görün
3. Fiyat bilgisi yeşil renkte vurgulanmıştır

## 📝 Notlar

- Yazdırma çıktıları artık daha kompakt ve okunabilir
- Gelir hesaplaması kurban fiyatlarına göre otomatik yapılır
- Organizasyon seçimi localStorage'da saklanır
- Tüm özellikler geriye dönük uyumlu
- Mevcut veriler etkilenmez

## 🔄 Önceki Sürümden Farklar

**v3.0 → v3.1:**
- ✅ Yazdırma fontları eski haline çekildi (daha kompakt)
- ✅ Organizasyon Seç sayfası eklendi
- ✅ Gelir-Gider sayfası eklendi
- ✅ Bağışçı tablosuna Fiyat sütunu eklendi
- ✅ Menü yapısı yeniden düzenlendi

---

**Versiyon**: 3.1  
**Tarih**: 2026-05-03  
**Geliştirici**: İÇDER & Defterdar
