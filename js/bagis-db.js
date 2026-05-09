/* ============================================
   İÇDER – Bağış Veritabanı (localStorage)
   ============================================ */

const BagisDB = {

  // ---- BAĞIŞ KAYDET ----
  kaydet(bagis) {
    const list = this.hepsiniGetir();
    const yeni = {
      id: 'B' + Date.now(),
      tarih: new Date().toISOString(),
      durum: bagis.tur === 'Kurban' ? 'bekliyor' : 'tamamlandi',
      not: bagis.tur === 'Kurban'
        ? 'Kurban kesim işleminiz hala devam etmekte. Kesildikten sonra kesildiğini buradan görebilirsiniz.'
        : '',
      ekNot: '',
      ...bagis
    };
    list.push(yeni);
    localStorage.setItem('icder_bagislar', JSON.stringify(list));
    return yeni;
  },

  // ---- HEPSİNİ GETİR ----
  hepsiniGetir() {
    return JSON.parse(localStorage.getItem('icder_bagislar') || '[]');
  },

  // ---- KULLANICIYA GÖRE ----
  kullaniciBagislari(kullaniciAdi) {
    return this.hepsiniGetir().filter(b =>
      b.kullaniciAdi && b.kullaniciAdi.toLowerCase() === kullaniciAdi.toLowerCase()
    );
  },

  // ---- GÜNCELLE ----
  guncelle(id, degisiklikler) {
    const list = this.hepsiniGetir();
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...degisiklikler };
    localStorage.setItem('icder_bagislar', JSON.stringify(list));
    return true;
  },

  // ---- TEK BAĞIŞ ----
  getir(id) {
    return this.hepsiniGetir().find(b => b.id === id) || null;
  },

  // ---- SİL ----
  sil(id) {
    const list = this.hepsiniGetir().filter(b => b.id !== id);
    localStorage.setItem('icder_bagislar', JSON.stringify(list));
  },

  // ---- KULLANICI KAYIT/GİRİŞ ----
  kullaniciKaydet(ad, soyad, tel, email) {
    const users = this.kullanicilariGetir();
    const kullaniciAdi = (ad + soyad).toLowerCase().replace(/\s/g, '').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c');
    if (users.find(u => u.kullaniciAdi === kullaniciAdi)) {
      return users.find(u => u.kullaniciAdi === kullaniciAdi);
    }
    const yeni = { kullaniciAdi, ad, soyad, tel, email, kayitTarihi: new Date().toISOString() };
    users.push(yeni);
    localStorage.setItem('icder_kullanicilar', JSON.stringify(users));
    return yeni;
  },

  kullanicilariGetir() {
    return JSON.parse(localStorage.getItem('icder_kullanicilar') || '[]');
  },

  aktifKullanici() {
    return JSON.parse(sessionStorage.getItem('icder_aktif_kullanici') || 'null');
  },

  girisYap(kullaniciAdi) {
    const users = this.kullanicilariGetir();
    const user = users.find(u => u.kullaniciAdi === kullaniciAdi);
    if (user) {
      sessionStorage.setItem('icder_aktif_kullanici', JSON.stringify(user));
      return user;
    }
    return null;
  },

  cikisYap() {
    sessionStorage.removeItem('icder_aktif_kullanici');
  }
};

window.BagisDB = BagisDB;
