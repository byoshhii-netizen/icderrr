const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Electron paketi içinde __dirname yazılamaz, userData kullan
function getDataDir() {
  try {
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
  // ozel_kategoriler tablosu - admin panelinden yönetilebilir kategoriler
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS ozel_kategoriler (id INTEGER PRIMARY KEY AUTOINCREMENT, kategori_adi TEXT UNIQUE NOT NULL, kategori_tipi TEXT DEFAULT 'bagisci', aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // ozel_filtreler tablosu - admin panelinden yönetilebilir filtreler
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS ozel_filtreler (id INTEGER PRIMARY KEY AUTOINCREMENT, filtre_adi TEXT NOT NULL, filtre_tipi TEXT NOT NULL, filtre_degeri TEXT, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  // giris_logosu tablosu - giriş sayfası logo yönetimi
  try { sqlDb.run("CREATE TABLE IF NOT EXISTS giris_logosu (id INTEGER PRIMARY KEY AUTOINCREMENT, logo_data TEXT, aktif INTEGER DEFAULT 1, olusturma DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(e) {}
  const data = sqlDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  _db = new DbWrapper(sqlDb);
  return _db;
}

module.exports = { getDb };
