# İÇDER Kurban Programı - Eski Kurulum Temizleme

## 🔧 Sorun: Eski Programda Kalıyor

Eğer yeni EXE'yi kurduktan sonra eski program açılıyorsa:

### ✅ Çözüm 1: Eski Programı Kaldır

1. **Eski programı kapat** (Task Manager'dan da kontrol et)
2. **Ayarlar → Uygulamalar** veya **Denetim Masası → Program Ekle/Kaldır**
3. Şunları ara ve kaldır:
   - "Defterdar Muhasebe"
   - "İÇDER Kurban Programı" (eski versiyon)
4. Yeni EXE'yi kur

### ✅ Çözüm 2: Manuel Temizleme

Eski program kaldırılmıyorsa:

```powershell
# 1. Programı kapat
taskkill /F /IM "DefterdarMuhasebe.exe"
taskkill /F /IM "icder-kurban.exe"

# 2. Kurulum klasörlerini sil
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Programs\DefterdarMuhasebe"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Programs\İÇDER Kurban Programı"
Remove-Item -Recurse -Force "$env:ProgramFiles\DefterdarMuhasebe"
Remove-Item -Recurse -Force "$env:ProgramFiles\İÇDER Kurban Programı"

# 3. Masaüstü kısayollarını sil
Remove-Item "$env:USERPROFILE\Desktop\Defterdar Muhasebe.lnk" -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\Desktop\İÇDER Kurban Programı.lnk" -ErrorAction SilentlyContinue
```

### ✅ Çözüm 3: Veritabanını Koru

Verilerinizi korumak için:

```powershell
# Eski veritabanını yedekle
Copy-Item "$env:APPDATA\icder-kurban\data\*" "C:\YedekKlasoru\" -Recurse
```

### ✅ Çözüm 4: Temiz Kurulum

1. Eski programı tamamen kaldır
2. Bilgisayarı yeniden başlat
3. Yeni EXE'yi kur

## 📦 Yeni Versiyon

**Dosya:** `İÇDER Kurban Programı Setup 1.0.1.exe`  
**Değişiklikler:**
- ✅ Splash sorunu düzeltildi
- ✅ Auth sistemi kaldırıldı
- ✅ Yeşil tema
- ✅ Çıkışta zorunlu yedekleme

## 🔍 Kontrol

Doğru programın açıldığını kontrol etmek için:

1. Programı aç
2. **Denetim Masası** → **Sistem** → **Uygulama Bilgileri**
3. Şunları kontrol et:
   - Uygulama: "İÇDER Kurban Programı"
   - Versiyon: 1.0.1
   - İşbirliği: "İÇDER & Defterdar"

## 💡 İpucu

Eğer hala eski program açılıyorsa:
- Masaüstü kısayolunu sil
- Başlat menüsünden "İÇDER Kurban Programı" ara
- Yeni kısayolu kullan
