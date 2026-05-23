# İÇDER Kurban Programı — PRD

## Problem Statement
"icderrr adlı uygulamamıza medya depolamasında sorun var düzelt ve pushla lütfen"
Sonra: "VEKALET TUŞUNA BASTIĞIMIZDA EKRANA BİR YAZI GELSİN VEKALET ALINDI ALINMADI EKRANI BÖYLE GÜZEL YAP"

## Architecture
- Backend: Node.js + Express (`server.js`, port 4500)
- Frontend: Vanilla JS (`public/app.js`, `public/index.html`, `public/style.css`)
- Storage: SQLite (`sql.js`) lokal + Cloudinary (medya)
- Distribution: Electron (`electron.js`) — Windows .exe (electron-builder)
- Railway web modu da destekli

## Implemented in this session (Jan 2026)

### 1) Medya listeleme bug fix (Cloudinary)
- `src/cloudinary.js` → `/api/medya/list` artık `cloudinary.api.resources({ prefix, ... })` (image+video paralel, sayfalı, 500 dosyaya kadar) kullanarak alt klasörleri de tarar. Eskiden `search.expression('folder:X')` yalnızca tam o klasörü tarıyordu, hisse alt klasörlerine yüklenen medyalar (`defterdar/hisse-1/...`) listede görünmüyordu.
- `public/app.js` `medyaKart()` → video kartlarında Cloudinary'nin otomatik poster (`/upload/so_auto/...jpg`) önizlemesi + alt klasör (`kurban-X/hisse-Y`) bilgisi gösteriliyor.
- Uçtan uca test ✅ (upload → list → delete; video poster JPEG 200).

### 2) Vekalet onay ekranı (UX iyileştirme)
- `vekaletModalAc()` → ana modal'ın üzerine binebilen bağımsız overlay; el sıkışma ikonu (animasyonlu halo), bağışçı + kurban/hisse bilgisi, iki büyük buton (yeşil "VEKALET ALINDI" / kırmızı "VEKALET ALINMADI"), mevcut durum aktif olarak vurgulanır, önceki onay tarihi pill içinde, dış tıklayıp kapatma.
- Seçim sonrası tam ekran başarı animasyonu (ring + pop + slide-in), 1.2 sn sonra kapanır → callback çağrılır.
- **Çağrı yerleri:**
  - Bağışçı Yönetimi tablosundaki vekalet butonu → `toggleVekalet()` modal'ı açar, seçim sonrası `PUT /hisseler/:id/vekalet` çağrısı.
  - Hisse formundaki "Vekalet Onayı" alanı → checkbox kaldırıldı, yerine stillenmiş tıklanabilir buton (`hisseVekaletAc()`), modal'ı açar, seçim hidden input + buton görünümünü canlı günceller, form kaydedilince DB'ye yazılır.
- CSS: `.vekalet-modal-wrap`, `.vekalet-hero`, `.vekalet-bilgi`, `.vekalet-secimler`, `.vekalet-btn--alindi/alinmadi(.aktif)`, `.vekalet-sonuc-overlay` + `vekaletHalo`, `sonucPop`, `sonucRing`, `sonucSlide`, `sonucFadeIn` animasyonları.
- Görsel doğrulama ✅ (screenshot ile her iki durum + başarı animasyonu).

## Backlog / Next
- (P2) Vekalet modalı klavye desteği (Enter = mevcut durum, Esc = iptal)
- (P2) Medya: klasör ağacı dropdown'u dinamik + toplu silme
- (P2) Gerçek upload progress (XHR onprogress)
