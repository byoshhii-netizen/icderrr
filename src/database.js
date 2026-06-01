const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Electron paketi içinde __dirname yazılamaz, userData kullan
function getDataDir() {
  try {
    const { app } = require('electron');
    // Electron ortamında - ProgramData altında sakla (güncelleme sonrası korunur)
    // Windows: C:\ProgramData\icder-kurban\data
    const userDataPath = app.getPath('userData');
    const dataPath = path.join(userDataPath, 'data');
    return dataPath;
  } catch (e) {
    // Node.js (geliştirme) ortamında
    return path.join(__dirname, '..', 'data');
  }
}

const dataDir = getDataDir();
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'icder-kurban.db');

let saveTimer = null;
function scheduleSave(sqlDb) {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const data = sqlDb.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) { console.error('DB kayit hatasi:', e); }
  }, 1000);
}

class Statement {
  constructor(sqlDb, sql) {
    this._sqlDb = sqlDb;
    this._sql = sql;
  }
  run(...params) {
    this._sqlDb.run(this._sql, params.length ? params : []);
    scheduleSave(this._sqlDb);
    const rows = this._sqlDb.exec('SELECT last_insert_rowid() as id');
    const lastId = rows.length > 0 ? rows[0].values[0][0] : 0;
    return { changes: this._sqlDb.getRowsModified(), lastInsertRowid: lastId };
  }
  get(...params) {
    const stmt = this._sqlDb.prepare(this._sql);
    try {
      stmt.bind(params.length ? params : []);
      if (stmt.step()) return stmt.getAsObject();
      return undefined;
    } finally { stmt.free(); }
  }
  all(...params) {
    const stmt = this._sqlDb.prepare(this._sql);
    const results = [];
    try {
      stmt.bind(params.length ? params : []);
      while (stmt.step()) results.push(stmt.getAsObject());
    } finally { stmt.free(); }
    return results;
  }
}

class DbWrapper {
  constructor(sqlDb) { this._sqlDb = sqlDb; }
  prepare(sql) { return new Statement(this._sqlDb, sql); }
  exec(sql) { this._sqlDb.run(sql); scheduleSave(this._sqlDb); }
  pragma(str) { try { this._sqlDb.run(`PRAGMA ${str}`); } catch (e) {} }
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS kullanicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_adi TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    olusturma DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS organizasyonlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    yil INTEGER NOT NULL,
    max_kurban INTEGER NOT NULL,
    buyukbas_hisse_fiyati REAL NOT NULL DEFAULT 0,
    kucukbas_hisse_fiyati REAL NOT NULL DEFAULT 0,
    aciklama TEXT,
    aktif INTEGER DEFAULT 1,
    kullanici_id INTEGER DEFAULT 1,
    olusturma DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS kurbanlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizasyon_id INTEGER NOT NULL,
    kurban_no INTEGER NOT NULL,
    tur TEXT NOT NULL,
    kurban_turu TEXT DEFAULT 'Udhiye',
    kesen_kisi TEXT,
    kucukbas_sayi INTEGER DEFAULT 1,
    kupe_no TEXT,
    alis_fiyati REAL DEFAULT 0,
    toplam_hisse INTEGER NOT NULL,
    kesildi INTEGER DEFAULT 0,
    kesim_tarihi TEXT,
    aciklama TEXT,
    olusturma DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS hisseler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kurban_id INTEGER NOT NULL,
    hisse_no INTEGER NOT NULL,
    bagisci_adi TEXT,
    bagisci_telefon TEXT,
    bagisci_kategori TEXT DEFAULT 'Genel Bağışçı',
    kimin_adina TEXT,
    kimin_adina_telefon TEXT,
    odeme_durumu TEXT DEFAULT 'bekliyor',
    video_ister INTEGER DEFAULT 0,
    aciklama TEXT,
    olusturma DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS cop_kutusu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tur TEXT NOT NULL,
    veri TEXT NOT NULL,
    silme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ayarlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id INTEGER DEFAULT 1,
    logo_data TEXT,
    bayrak_data TEXT,
    kurulum_tamamlandi INTEGER DEFAULT 0
  );
`;

let _db = null;

async function getDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    sqlDb = new SQL.Database();
  }
  sqlDb.run('PRAGMA foreign_keys = ON');
  SCHEMA.split(';').map(s => s.trim()).filter(Boolean).forEach(s => sqlDb.run(s));
  
  // Varsayılan kullanıcı oluştur (EXE için)
  try {
    const userCheck = sqlDb.exec('SELECT id FROM kullanicilar WHERE id=1');
    if (!userCheck || userCheck.length === 0) {
      sqlDb.run("INSERT INTO kullanicilar (id, kullanici_adi, email, sifre_hash) VALUES (1, 'icder', 'icder@kurban.com', 'dummy')");
    }
  } catch(e) {}
  
  // Varsayılan ayarlar oluştur
  try {
    const ayarCheck = sqlDb.exec('SELECT id FROM ayarlar WHERE kullanici_id=1');
    if (!ayarCheck || ayarCheck.length === 0) {
      sqlDb.run("INSERT INTO ayarlar (kullanici_id, kurulum_tamamlandi) VALUES (1, 0)");
    }
  } catch(e) {}
  
  // Migration: eski DB'ye yeni kolonları ekle
  try { sqlDb.run("ALTER TABLE kurbanlar ADD COLUMN kurban_turu TEXT DEFAULT 'Udhiye'"); } catch(e) {}
  try { sqlDb.run("ALTER TABLE kurbanlar ADD COLUMN kesen_kisi TEXT"); } catch(e) {}
  try { sqlDb.run("ALTER TABLE kurbanlar ADD COLUMN kucukbas_sayi INTEGER DEFAULT 1"); } catch(e) {}
  try { sqlDb.run("ALTER TABLE organizasyonlar ADD COLUMN kullanici_id INTEGER DEFAULT 1"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS cop_kutusu (id INTEGER PRIMARY KEY AUTOINCREMENT, tur TEXT NOT NULL, veri TEXT NOT NULL, silme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS ayarlar (id INTEGER PRIMARY KEY AUTOINCREMENT, kullanici_id INTEGER DEFAULT 1, logo_data TEXT, bayrak_data TEXT, kurulum_tamamlandi INTEGER DEFAULT 0)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS kullanicilar (id INTEGER PRIMARY KEY AUTOINCREMENT, kullanici_adi TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, sifre_hash TEXT NOT NULL, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // sistem_ayarlari tablosu ve varsayılan değerler
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS sistem_ayarlari (id INTEGER PRIMARY KEY AUTOINCREMENT, anahtar TEXT UNIQUE NOT NULL, deger TEXT)"); } catch(e) {}
  try { sqlDb.run("INSERT OR IGNORE INTO sistem_ayarlari (anahtar, deger) VALUES ('admin_sifre', 'BeYA0411')"); } catch(e) {}
  try { sqlDb.run("INSERT OR IGNORE INTO sistem_ayarlari (anahtar, deger) VALUES ('sistem_modu', 'acik')"); } catch(e) {}
  try { sqlDb.run("INSERT OR IGNORE INTO sistem_ayarlari (anahtar, deger) VALUES ('sistem_notu', '')"); } catch(e) {}
  try { sqlDb.run("INSERT OR IGNORE INTO sistem_ayarlari (anahtar, deger) VALUES ('oto_yedek_aktif', '1')"); } catch(e) {}
  try { sqlDb.run("INSERT OR IGNORE INTO sistem_ayarlari (anahtar, deger) VALUES ('oto_yedek_dakika', '10')"); } catch(e) {}
  // ayarlar tablosuna icder_sifre kolonu ekle
  try { sqlDb.run("ALTER TABLE ayarlar ADD COLUMN icder_sifre TEXT DEFAULT '571571'"); } catch(e) {}
  // destek_talepleri tablosu
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS destek_talepleri (id INTEGER PRIMARY KEY AUTOINCREMENT, konu TEXT, mesaj TEXT, ad TEXT, email TEXT, admin_cevap TEXT, durum TEXT DEFAULT 'bekliyor', okundu INTEGER DEFAULT 0, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP, guncelleme DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // bagisci_kategori kolonu ekle
  try { sqlDb.run("ALTER TABLE hisseler ADD COLUMN bagisci_kategori TEXT DEFAULT 'Genel Bağışçı'"); } catch(e) {}
  // kurbanlar tablosuna fiyat kolonu ekle (alis_fiyati ile aynı, ama frontend fiyat kullanıyor)
  try { sqlDb.run("ALTER TABLE kurbanlar ADD COLUMN fiyat REAL DEFAULT 0"); } catch(e) {}
  // fiyat kolonunu alis_fiyati ile senkronize et (fiyat boşsa alis_fiyati kullan)
  try { sqlDb.run("UPDATE kurbanlar SET fiyat = alis_fiyati WHERE fiyat IS NULL OR fiyat = 0"); } catch(e) {}
  // hisseler tablosuna kurban_turu kolonu ekle (her hisse için ayrı kurban türü)
  try { sqlDb.run("ALTER TABLE hisseler ADD COLUMN kurban_turu TEXT DEFAULT 'Udhiye'"); } catch(e) {}
  // hisseler tablosuna vekalet_onay kolonu ekle
  try { sqlDb.run("ALTER TABLE hisseler ADD COLUMN vekalet_onay INTEGER DEFAULT 0"); } catch(e) {}
  // hisseler tablosuna vekalet_tarihi kolonu ekle
  try { sqlDb.run("ALTER TABLE hisseler ADD COLUMN vekalet_tarihi DATETIME"); } catch(e) {}
  // oto_yedek_loglar tablosu
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS oto_yedek_loglar (id INTEGER PRIMARY KEY AUTOINCREMENT, dosya_adi TEXT NOT NULL, boyut INTEGER DEFAULT 0, tarih DATETIME DEFAULT CURRENT_TIMESTAMP, durum TEXT DEFAULT 'basarili')"); } catch(e) {}
  // ozel_kategoriler tablosu - admin panelinden yönetilebilir kategoriler
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS ozel_kategoriler (id INTEGER PRIMARY KEY AUTOINCREMENT, kategori_adi TEXT UNIQUE NOT NULL, kategori_tipi TEXT DEFAULT 'bagisci', aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // ozel_filtreler tablosu - admin panelinden yönetilebilir filtreler
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS ozel_filtreler (id INTEGER PRIMARY KEY AUTOINCREMENT, filtre_adi TEXT NOT NULL, filtre_tipi TEXT NOT NULL, filtre_degeri TEXT, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // giris_logosu tablosu - giriş sayfası logo yönetimi
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS giris_logosu (id INTEGER PRIMARY KEY AUTOINCREMENT, logo_data TEXT, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // Personel tabloları
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS personeller (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, soyad TEXT NOT NULL, tc_no TEXT, dogum_tarihi TEXT, telefon TEXT, email TEXT, adres TEXT, pozisyon TEXT, departman TEXT, ise_baslama TEXT, maas REAL DEFAULT 0, iban TEXT, banka TEXT, acil_kisi TEXT, acil_telefon TEXT, fotograf TEXT, notlar TEXT, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS personel_devamsizlik (id INTEGER PRIMARY KEY AUTOINCREMENT, personel_id INTEGER NOT NULL, tarih TEXT NOT NULL, tur TEXT DEFAULT 'gelmedi', aciklama TEXT, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS personel_avans (id INTEGER PRIMARY KEY AUTOINCREMENT, personel_id INTEGER NOT NULL, miktar REAL NOT NULL, tarih TEXT NOT NULL, aciklama TEXT, odendi INTEGER DEFAULT 0, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS personel_maas (id INTEGER PRIMARY KEY AUTOINCREMENT, personel_id INTEGER NOT NULL, ay TEXT NOT NULL, maas REAL NOT NULL, odendi INTEGER DEFAULT 0, odeme_tarihi TEXT, aciklama TEXT, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS personel_notlar (id INTEGER PRIMARY KEY AUTOINCREMENT, personel_id INTEGER NOT NULL, tur TEXT DEFAULT 'genel', baslik TEXT, icerik TEXT NOT NULL, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // hisseler tablosuna video_url kolonu ekle (yedek uyumluluğu için)
  try { sqlDb.run("ALTER TABLE hisseler ADD COLUMN video_url TEXT"); } catch(e) {}
  // hisseler tablosuna video_public_id kolonu ekle (yedek uyumluluğu için)
  try { sqlDb.run("ALTER TABLE hisseler ADD COLUMN video_public_id TEXT"); } catch(e) {}
  // Kasa tabloları
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS kasa_hareketleri (id INTEGER PRIMARY KEY AUTOINCREMENT, tarih TEXT NOT NULL, tur TEXT NOT NULL DEFAULT 'giris', kategori TEXT, aciklama TEXT NOT NULL, tutar REAL NOT NULL, belge_data TEXT, belge_adi TEXT, personel_id INTEGER, organizasyon_id INTEGER, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS kasa_gider_kalemleri (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, kategori TEXT, varsayilan_tutar REAL DEFAULT 0, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS kasa_gelir_kalemleri (id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL, kategori TEXT, varsayilan_tutar REAL DEFAULT 0, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // Varsayılan gider kalemleri (yoksa ekle)
  try {
    const giderSayisi = sqlDb.exec("SELECT COUNT(*) as c FROM kasa_gider_kalemleri WHERE aktif=1");
    const sayi = giderSayisi?.[0]?.values?.[0]?.[0] || 0;
    if (sayi === 0) {
      const giderler = [
        ['Ofis Kirası','kira',0],['Elektrik Faturası','fatura',0],['Su Faturası','fatura',0],
        ['İnternet Faturası','fatura',0],['Yakıt','yakıt',0],['Kırtasiye','kırtasiye',0],
        ['Temizlik Malzemesi','temizlik',0],['Yemek / İkram','yemek',0],['Ulaşım','ulaşım',0],
        ['Bakım / Onarım','diger',0],['Diğer Gider','diger',0]
      ];
      giderler.forEach(([ad,kat,tutar]) => {
        try { sqlDb.run("INSERT INTO kasa_gider_kalemleri (ad,kategori,varsayilan_tutar) VALUES (?,?,?)", [ad,kat,tutar]); } catch(e) {}
      });
    }
  } catch(e) {}
  // Varsayılan gelir kalemleri (yoksa ekle)
  try {
    const gelirSayisi = sqlDb.exec("SELECT COUNT(*) as c FROM kasa_gelir_kalemleri WHERE aktif=1");
    const sayi2 = gelirSayisi?.[0]?.values?.[0]?.[0] || 0;
    if (sayi2 === 0) {
      const gelirler = [
        ['Bağış Geliri','bagis',0],['Kurban Organizasyonu','organizasyon',0],
        ['Su Kuyusu Organizasyonu','organizasyon',0],['Kira Geliri','kira_geliri',0],
        ['Hibe / Destek','hibe',0],['Proje Geliri','diger',0],['Diğer Gelir','diger',0]
      ];
      gelirler.forEach(([ad,kat,tutar]) => {
        try { sqlDb.run("INSERT INTO kasa_gelir_kalemleri (ad,kategori,varsayilan_tutar) VALUES (?,?,?)", [ad,kat,tutar]); } catch(e) {}
      });
    }
  } catch(e) {}
  const data = sqlDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  _db = new DbWrapper(sqlDb);
  return _db;
}

module.exports = { getDb };
