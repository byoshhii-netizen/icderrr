/* ICDER Bagis Veritabani - API + localStorage fallback */
const BagisDB = {

  async _get(url) {
    try { const r = await fetch(url); return r.ok ? r.json() : null; } catch { return null; }
  },
  async _post(url, data) {
    try { const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); return r.json(); } catch { return null; }
  },
  async _put(url, data) {
    try { const r = await fetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); return r.json(); } catch { return null; }
  },
  _lsGet(k) { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } },
  _lsSet(k,v) { localStorage.setItem(k, JSON.stringify(v)); },

  // ---- BAGIS ----
  async kaydet(bagis) {
    const r = await this._post('/api/bagislar', bagis);
    if (r && r.id) {
      const list = this._lsGet('icder_bagislar');
      list.push(r);
      this._lsSet('icder_bagislar', list);
      return r;
    }
    return this._lsKaydet(bagis);
  },

  async hepsiniGetir() {
    const r = await this._get('/api/bagislar');
    return r || this._lsGet('icder_bagislar');
  },

  async kullaniciBagislari(kullaniciAdi) {
    const list = await this.hepsiniGetir();
    return list.filter(b => b.kullaniciAdi && b.kullaniciAdi.toLowerCase() === kullaniciAdi.toLowerCase());
  },

  async guncelle(id, data) {
    await this._put('/api/bagislar/' + id, data);
    const list = this._lsGet('icder_bagislar');
    const idx = list.findIndex(b => b.id === id);
    if (idx >= 0) { list[idx] = Object.assign({}, list[idx], data); this._lsSet('icder_bagislar', list); }
    return true;
  },

  _lsKaydet(bagis) {
    const list = this._lsGet('icder_bagislar');
    const yeni = Object.assign({
      id: 'B' + Date.now(),
      tarih: new Date().toISOString(),
      durum: (bagis.tur||'').indexOf('Kurban') >= 0 ? 'bekliyor' : 'tamamlandi',
      not: (bagis.tur||'').indexOf('Kurban') >= 0 ? 'Kurban kesim isleminiz devam etmekte.' : '',
      ekNot: ''
    }, bagis);
    list.push(yeni);
    this._lsSet('icder_bagislar', list);
    return yeni;
  },

  // ---- KULLANICI ----
  async kayitOl(ad, soyad, tel, email, sifre) {
    // Kullanici adi olustur
    const kullaniciAdi = (ad + soyad).toLowerCase()
      .replace(/\s/g,'').replace(/g/g,'g')
      .replace(/[^a-z0-9]/g, '');

    const data = { ad, soyad, tel, email, sifre, kullaniciAdi };
    const r = await this._post('/api/kullanicilar', data);
    if (r && r.kullaniciAdi) {
      const users = this._lsGet('icder_kullanicilar');
      if (!users.find(u => u.kullaniciAdi === r.kullaniciAdi)) { users.push(r); this._lsSet('icder_kullanicilar', users); }
      sessionStorage.setItem('icder_aktif_kullanici', JSON.stringify(r));
      return { ok: true, user: r };
    }
    // Fallback localStorage
    const users = this._lsGet('icder_kullanicilar');
    if (users.find(u => u.kullaniciAdi === kullaniciAdi)) {
      return { ok: false, hata: 'Bu kullanici adi zaten kayitli.' };
    }
    const yeni = { kullaniciAdi, ad, soyad, tel, email, sifre, kayitTarihi: new Date().toISOString() };
    users.push(yeni);
    this._lsSet('icder_kullanicilar', users);
    sessionStorage.setItem('icder_aktif_kullanici', JSON.stringify(yeni));
    return { ok: true, user: yeni };
  },

  async girisYap(kullaniciAdi, sifre) {
    // API ile dene
    const r = await this._post('/api/giris', { kullaniciAdi, sifre });
    if (r && r.ok) {
      sessionStorage.setItem('icder_aktif_kullanici', JSON.stringify(r.user));
      return { ok: true, user: r.user };
    }
    // localStorage fallback
    const users = this._lsGet('icder_kullanicilar');
    const user = users.find(u => u.kullaniciAdi === kullaniciAdi && u.sifre === sifre);
    if (user) {
      sessionStorage.setItem('icder_aktif_kullanici', JSON.stringify(user));
      return { ok: true, user };
    }
    return { ok: false, hata: 'Kullanici adi veya sifre yanlis.' };
  },

  aktifKullanici() {
    try { return JSON.parse(sessionStorage.getItem('icder_aktif_kullanici') || 'null'); } catch { return null; }
  },

  cikisYap() {
    sessionStorage.removeItem('icder_aktif_kullanici');
  },

  async kullanicilariGetir() {
    const r = await this._get('/api/kullanicilar');
    return r || this._lsGet('icder_kullanicilar');
  }
};

window.BagisDB = BagisDB;
