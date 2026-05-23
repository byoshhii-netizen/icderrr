# GitHub'a Push Etme Rehberi

## 🔐 Sorun: Permission Denied

Git şu anda "Cambazzzzzzz" hesabıyla giriş yapmış durumda, ama "byoshhii-netizen" hesabına push yapmaya çalışıyor.

## ✅ Çözüm 1: GitHub Desktop Kullan (EN KOLAY)

1. **GitHub Desktop'ı aç**
2. **File → Add Local Repository**
3. `C:\Users\user\Acro\icder-kurban` klasörünü seç
4. **Repository → Repository Settings**
5. Remote URL'i değiştir:
   ```
   https://github.com/byoshhii-netizen/icderkurban.git
   ```
6. **Publish repository** veya **Push origin**

## ✅ Çözüm 2: Git Credential Manager

```powershell
# 1. Mevcut credential'ı temizle
git credential-manager delete https://github.com

# 2. Push yap (yeni giriş isteyecek)
cd icder-kurban
git push -u origin main
```

Giriş ekranı açılınca **byoshhii-netizen** hesabıyla giriş yap.

## ✅ Çözüm 3: Personal Access Token

1. **GitHub → Settings → Developer settings → Personal access tokens**
2. **Generate new token (classic)**
3. Scope: `repo` seç
4. Token'ı kopyala
5. Push yaparken şifre yerine token'ı kullan:

```powershell
cd icder-kurban
git push -u origin main
# Username: byoshhii-netizen
# Password: [TOKEN_BURAYA]
```

## ✅ Çözüm 4: SSH Key Kullan

```powershell
# 1. SSH key oluştur
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. Public key'i kopyala
cat ~/.ssh/id_ed25519.pub

# 3. GitHub → Settings → SSH Keys → New SSH key
# Public key'i yapıştır

# 4. Remote URL'i SSH'e çevir
cd icder-kurban
git remote set-url origin git@github.com:byoshhii-netizen/icderkurban.git
git push -u origin main
```

## 📦 Push Edilecek Dosyalar

- ✅ Kaynak kodlar (src/, public/, assets/)
- ✅ Konfigürasyon (package.json, electron.js, server.js)
- ✅ Dokümantasyon (README.md, KURULUM.md, vb.)
- ❌ node_modules/ (gitignore'da)
- ❌ dist/ (gitignore'da)
- ❌ data/ (gitignore'da)

## 🚀 Push Sonrası

Repository'de şunlar olacak:
- Kaynak kodlar
- Dokümantasyon
- Kurulum scriptleri
- .gitignore

EXE dosyaları GitHub'da olmayacak (çok büyük). Releases bölümünden yükleyebilirsin.

## 💡 İpucu

Eğer hala sorun yaşıyorsan:
1. GitHub Desktop kullan (en kolay)
2. Veya repository'yi "Cambazzzzzzz" hesabına push et
3. Sonra GitHub'da transfer et "byoshhii-netizen" hesabına
