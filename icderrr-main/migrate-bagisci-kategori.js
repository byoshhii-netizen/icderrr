// Migration: Hisseler tablosuna bagisci_kategori sütunu ekle
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'icder-kurban.db');

async function migrate() {
  console.log('Migration başlatılıyor...');
  
  if (!fs.existsSync(DB_PATH)) {
    console.log('Veritabanı dosyası bulunamadı. Yeni kurulumda otomatik oluşturulacak.');
    return;
  }

  const SQL = await initSqlJs();
  const sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));

  try {
    // Sütunun var olup olmadığını kontrol et
    const tableInfo = sqlDb.exec("PRAGMA table_info(hisseler)");
    const columns = tableInfo[0]?.values.map(row => row[1]) || [];
    
    if (columns.includes('bagisci_kategori')) {
      console.log('✓ bagisci_kategori sütunu zaten mevcut.');
    } else {
      console.log('bagisci_kategori sütunu ekleniyor...');
      sqlDb.run("ALTER TABLE hisseler ADD COLUMN bagisci_kategori TEXT DEFAULT 'Genel Bağışçı'");
      console.log('✓ bagisci_kategori sütunu başarıyla eklendi.');
    }

    // Veritabanını kaydet
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, data);
    console.log('✓ Veritabanı kaydedildi.');
    
  } catch (error) {
    console.error('Migration hatası:', error);
  } finally {
    sqlDb.close();
  }
  
  console.log('Migration tamamlandı!');
}

migrate().catch(console.error);
