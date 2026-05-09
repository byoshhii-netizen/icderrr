/* ============================================
   ICDER – Bağış Veritabanı
   API varsa sunucuya, yoksa localStorage'a yazar
   ============================================ */

const BagisDB = {

  apiBase: '',  // aynı origin, prefix yok

  async _get(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      return await r.json();
    } catch { return null; }
  },

  async _post(url, data) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await r.json();
    } catch { return null; }
  },

  async _put(url, data) {
    try {
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await r.json();
    } catch { return null; }
  },

  // ---- BAĞIŞ KAYDET ----
  async kaydet(bagis) {
    const result = await this._post('/api/bagislar', bagis);
    if (result) {
      // localStorage'a da yaz (offline fallback)
      const list = this._lsGet('icder_bagislar');
      list.push(result);
      this._lsSet('icder_bagislar', list);
      return result;
    }
    // API yoksa localStorage
    return this._lsKaydet(bagis);
  },

  // ---- HEPSİNİ GETİR ----
  async hepsiniGetir() {
    const result = await this._get('/api/bagislar');
    if (result) return result;
    return this._lsGet('icder_bagislar');
  },

  // ---- KULLANICIYA GÖRE ----
  async kullaniciBagislari(kullaniciAdi) {
    const list = await this.hepsiniGetir();
    return list.filter(b =>
      b.kullaniciAdi && b.kullaniciAdi.toLowerCase() === kullaniciAdi.toLowerCase()
    );
  },

  // ---- GÜNCELLE ----
  async guncelle(id, degisiklikler) {
    const result = await this._put(`/api/bagislar/${id}`, degisiklikler);
    if (result) {
      // localStorage'ı da güncelle
      const list = this._lsGet('icder_bagislar');
      const idx = list.findIndex(b => b.id === id);
      if (idx !== -1) { list[idx] = { ...list[idx], ...degisiklikler }; this._lsSet('icder_bagislar', list); }
      return true;
    }
    // Fallback
    const list = this._lsGet('icder_bagislar');
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...degisiklikler };
    this._lsSet('icder_bagislar', list);
    return true;
  },

  // ---- KULLANICI KAYDET ----
  async kullaniciKaydet(ad, soyad, tel, email) {
    const result = await this._post('/api/kullanicilar', { ad, soyad, tel, email });
    if (result && !result.error) {
      const users = this._lsGet('icder_kullanicilar');
      if (!users.find(u => u.kullaniciAdi === result.kullaniciAdi)) {
        users.push(result);
        this._lsSet('icder_kullanicilar', users);
      }
      return result;
    }
    return this._lsKullaniciKaydet(ad, soyad, tel, email);
  },

  async kullanicilariGetir() {
    const result = await this._get('/api/kullanicilar');
    if (result) return result;
    return this._lsGet('icder_kullanicilar');
  },

  async girisYap(kullaniciAdi) {
    const result = await this._get(`/api/kullanicilar/${kullaniciAdi}`);
    const user = result && !result.error ? result : this._lsGet('icder_kullanicilar').find(u => u.kullaniciAdi === kullaniciAdi);
    if (user) {
      sessionStorage.setItem('icder_aktif_kullanici', JSON.stringify(user));
      return user;
    }
    return null;
  },

  aktifKullanici() {
    return JSON.parse(sessionStorage.getItem('icder_aktif_kullanici') || 'null');
  },

  cikisYap() {
    sessionStorage.removeItem('icder_aktif_kullanici');
  },

  // ---- LOCALSTORAGE FALLBACK ----
  _lsGet(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } },
  _lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  _lsKaydet(bagis) {
    const list = this._lsGet('icder_bagislar');
    const yeni = {
      id: 'B' + Date.now(),
      tarih: new Date().toISOString(),
      durum: (bagis.tur||'').includes('Kurban') ? 'bekliyor' : 'tamamlandi',
      not: (bagis.tur||'').includes('Kurban') ? 'Kurban kesim işleminiz devam etmekte.' : '',
      ekNot: '',
      ...bagis
    };
    list.push(yeni);
    this._lsSet('icder_bagislar', list);
    return yeni;
  },

  _lsKullaniciKaydet(ad, soyad, tel, email) {
    const users = this._lsGet('icder_kullanicilar');
    const kullaniciAdi = (ad + soyad).toLowerCase()
      .replace(/\s/g,'').replace(/ğ/g,'g').replace(/ü/g,'u')
      .replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c');
    let user = users.find(u => u.kullaniciAdi === kullaniciAdi);
    if (!user) {
      user = { kullaniciAdi, ad, soyad, tel, email, kayitTarihi: new Date().toISOString() };
      users.push(user);
      this._lsSet('icder_kullanicilar', users);
    }
    return user;
  }
};

window.BagisDB = BagisDB;
