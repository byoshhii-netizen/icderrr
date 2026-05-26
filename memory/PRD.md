# İÇDER Kurban Programı — PRD

## Problem Statements (running log)
1. "icderrr adlı uygulamamıza medya depolamasında sorun var düzelt ve pushla lütfen"
2. "VEKALET TUŞUNA BASTIĞIMIZDA EKRANA BİR YAZI GELSİN VEKALET ALINDI ALINMADI EKRANI BÖYLE GÜZEL YAP"
3. "gardaş sol üstte bizim içder logosu olması lazım … admin panelindeki bakım kapalı gibi sistem durumlarının çalışabilmesi lazım"

## Architecture
- Backend: Node.js + Express (`server.js`, port 4500)
- Frontend: Vanilla JS (`public/app.js`, `public/index.html`, `public/style.css`, `public/admin-app.js`, `public/admin.html`)
- Storage: SQLite (`sql.js`) lokal + Cloudinary (medya)
- Distribution: Electron (`electron.js`) — Windows .exe (electron-builder)
- Railway web modu da destekli

## Implemented in this session

### 1) Medya listeleme bug fix (Cloudinary)
- `/api/medya/list` artık `resources({ prefix })` ile alt klasör (`hisse/kurban/...`) dahil tüm dosyaları listeler.
- Video kartlarında Cloudinary'nin gerçek poster (`so_auto/...jpg`) önizlemesi + alt klasör yolu rozeti.

### 2) Vekalet onay ekranı
- `vekaletModalAc()` — bağımsız overlay, animasyonlu halo'lu el sıkışma ikonu, bağışçı + Kurban#/Hisse, iki büyük buton (yeşil/kırmızı), aktif durum vurgusu, önceki onay tarihi pill.
- Seçim sonrası **tam ekran başarı animasyonu** (ring + pop + slide) → 1.2 sn'de kapanır.
- **Çağrı yerleri:** Bağışçı Yönetimi tablosu (`toggleVekalet`) + Hisse formu (`hisseVekaletAc` — checkbox yerine stillenmiş buton).

### 3) Üst bar logosu
- Kullanıcının sağladığı İÇDER logosu `/app/public/icder.png` olarak eklendi.
- Backend (`admin-routes.js`):
  - `GET  /api/admin/ui-logo-bilgi` → `{ var, boyut_kb, v }` (cache-busting sürüm)
  - `POST /api/admin/ui-logo`       → admin-protected multipart upload (max 5 MB, png/jpg/webp/gif)
  - `DELETE /api/admin/ui-logo`     → admin-protected silme
  - Dosya hem `/app/public/icder.png` olarak yazılır hem `sistem_ayarlari.ui_logo_b64` olarak DB'ye kaydedilir.
  - Sunucu başlangıcında dosya yoksa DB'den geri yazılır (Railway ephemeral disk için).
- Admin paneli: **"Üst Bar Logosu"** yeni menü → mevcut logo önizleme + boyut + sürüm + **Logoyu Sil** butonu + drag&drop yükleme + progress bar.
- Frontend (`app.js` `uiLogoYenile`) sayfa açıldığında `?v=<sürüm>` query string ile logoyu cache-bypass yapar.

### 4) Sistem modu (Bakım / Kapalı) — sıkı blokaj
- `server.js` → `/api/*` öncesi `sistemModuApiBlokaj` middleware:
  - Admin oturumu varsa geçirir.
  - `/api/auth/*` ve `/api/admin/sistem-modu` istisna (giriş + polling).
  - Mod = `bakim`|`kapali` ise: `req.session.icderGiris` silinir, **HTTP 503 + `{bloke:true, sistem_modu, sistem_notu}`** döner.
- Frontend (`app.js`):
  - `sistemModuKontrol()` her 10 sn'de bir `/api/admin/sistem-modu` poll'lar.
  - Mod değiştiğinde `sistemModuBlokeAtla()` → tam ekran bakım katmanı (renkli ikon, başlık, Yönetici Notu, 3 sn sayaç) → `/icder-giris`'e yönlendirir (orası da bakım ekranı gösterir).
  - `api()` fonksiyonu 503 + `bloke=true` yakaladığında otomatik bakım katmanı açar.

## Verified end-to-end (lokal test)
- ✅ Medya: upload → list (alt klasör dahil) → delete; video poster JPG 200.
- ✅ Vekalet modal'ı: alındı/alınmadı vurgusu + başarı animasyonu (Playwright screenshots).
- ✅ Logo upload (multipart) → 200 + sürüm, dosya gerçekten değişiyor; delete → file removed + DB cleared; re-upload (525 KB) → 200.
- ✅ Sistem modu API:
  - acik → user 200 ✓
  - bakim → user 503 bloke ✓, admin 200 ✓
  - kapali → user 503 bloke ✓
  - acik → user re-login + 200 ✓
- ✅ Sistem modu otomatik atılma (kullanıcı oturumdayken bakım'a geçirildi → tam ekran bakım katmanı çıktı → 3 sn sayaç).
- ✅ Admin panel "Üst Bar Logosu" sayfası görsel olarak doğru (önizleme, sil butonu, drag&drop).

## Backlog / Next
- (P2) Vekalet modal klavye desteği (Enter onayla, Esc iptal)
- (P2) Sistem modu için "izin verilen IP listesi" (admin dışı belirli kullanıcılar geçebilsin)
- (P2) Logo CDN'e (Cloudinary) yedeklenebilir
- (P2) Medya: dinamik klasör ağacı + toplu silme
