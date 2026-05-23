# İÇDER Kurban Programı — PRD

## Problem Statement
"icderrr adlı uygulamamıza medya depolamasında sorun var düzelt ve pushla lütfen"

Bağlam: Electron + Express tabanlı desktop uygulama, medya depolama olarak Cloudinary kullanılıyor. Kullanıcı şikayet: Yüklenen medyalar (resim/video) "Medya Deposu" sayfasında görüntülenemiyor.

## Architecture
- Backend: Node.js + Express (`server.js`, port 4500)
- Frontend: Vanilla JS (`public/app.js`, `public/index.html`)
- Storage: SQLite (`sql.js`) lokal + Cloudinary (medya)
- Distribution: Electron (`electron.js`) — Windows .exe (electron-builder)
- Railway web modu da destekli (PORT/RAILWAY_ENVIRONMENT env varsa `database-web` kullanılır)

## Core Requirements
- Kurban / hisse / bağışçı yönetimi
- Cloudinary üzerinden medya (resim + video) yükleme, listeleme, silme
- Hisse bazlı medya yükleme (alt klasör: `defterdar/kurban-X/hisse-Y/...`)
- Yedekleme (Excel + JSON), otomatik yedek

## What's been implemented (this session — Jan 2026)
- **Bug fix: Medya listeleme alt klasörleri kapsamıyordu.**
  - `src/cloudinary.js` `/api/medya/list`:
    - Cloudinary `search.expression('folder:X')` yalnızca tam o klasörü kapsıyor, alt klasörleri (örn. `defterdar/hisse-1/...`) atlıyordu → kullanıcı yüklediği medyayı listede göremiyordu.
    - `cloudinary.api.resources({ type:'upload', prefix, resource_type })` + sayfalama (5 sayfa × 100 = 500 dosya max) ile image+video paralel çekilip oluşturma tarihine göre sıralanıyor. Prefix recursive davrandığı için alt klasörler dahil.
  - `public/app.js` `medyaKart()`:
    - Video kartları artık Cloudinary'nin otomatik poster (`/upload/so_auto,w_400,h_300,c_fill/...jpg`) URL'iyle gerçek bir önizleme gösteriyor (eskiden sadece ikon vardı).
    - Kart altında dosyanın hangi alt klasörde olduğu (örn. `kurban-1/hisse-2`) gösteriliyor.

## Verified end-to-end (lokal test)
1. POST `/api/medya/upload` (folder=`defterdar/test-fix`) → 200, secure_url döner
2. GET `/api/medya/list?folder=defterdar` → yüklenen alt klasördeki dosya listede `found=true`
3. DELETE `/api/medya/delete` → 200
4. Video poster URL HTTP 200 / image/jpeg

## Backlog / Next
- (P2) Medya sayfasında klasör/türe göre filtre + arama
- (P2) Toplu silme
- (P2) Yükleme sırasında gerçek progress (xhr) — şu an sadece sahte
- (P2) Klasör ağacını dinamik göster (statik dropdown yerine)
