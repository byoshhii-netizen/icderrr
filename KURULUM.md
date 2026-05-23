# İÇDER Kurban Programı - Kurulum Rehberi

## Geliştirme Ortamı

### Gereksinimler
- Node.js 18 veya üzeri
- npm

### Kurulum Adımları

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Uygulamayı çalıştırın:
```bash
npm run electron
```

## EXE Oluşturma

```bash
npm run build
```

EXE dosyası `dist/` klasöründe oluşturulacaktır.

## Özellikler

### ✅ Tamamlanan
- Yeşil İslami tema
- Giriş/kayıt sistemi kaldırıldı
- Çıkışta zorunlu yedekleme
- Yazdırmada kuruluş ismi kaldırıldı (sadece logolar)
- İçder logosu eklendi
- Veritabanı: icder-kurban.db

### 📝 Notlar
- Uygulama kapatılırken yedek almadan çıkış yapılamaz
- Yazdırma: Sadece logolar görünür, kuruluş ismi yazmaz
- Tema: Yeşil İslami renk paleti

## Lisans
© 2025 İÇDER & Defterdar İşbirliği
