# Railway Volume Kurulumu — Veri Kalıcılığı

Railway'de her deploy'da SQLite verisi sıfırlanır.
Bunu önlemek için **Volume** kullanılmalıdır.

## Adımlar

### 1. Railway Dashboard'da Volume Ekle

1. Railway projenizi açın
2. Sol menüden projenizi seçin
3. **"+ New"** → **"Volume"** tıklayın
4. Mount Path: `/data` yazın
5. **"Create"** tıklayın

### 2. Environment Variable Ekle

Railway projenizde **Variables** sekmesine gidin ve ekleyin:

```
DATA_DIR=/data
```

### 3. Redeploy

Deploy tetikleyin — artık `/data/icder-kurban.db` dosyası
her deploy'da korunacak.

## Özet

| Ayar | Değer |
|------|-------|
| Volume Mount Path | `/data` |
| Environment Variable | `DATA_DIR=/data` |
| DB Dosyası | `/data/icder-kurban.db` |

## Not

- Volume Railway Pro planında ücretsiz, Hobby planında ücretli olabilir
- Volume olmadan veriler her deploy'da sıfırlanır
- Volume ekledikten sonra ilk deploy'da boş DB oluşur, önceki veriler gelmez
- Önceki verileri taşımak için "Yedek Al" → yeni deploy → "Yedek Geri Yükle" yapın
