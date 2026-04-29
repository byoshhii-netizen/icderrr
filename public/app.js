// ─── AUTH KONTROL KALDIRILDI (EXE İÇİN) ─────────────────────────────────────
// Kullanıcı ayarları global
let _kullaniciAyarlar = { logo_data: null, bayrak_data: null, kurulum_tamamlandi: 0 };
let _kullaniciAdi = 'İÇDER';

// Direkt başlat
(async function init() {
  await yukleKullaniciAyarlar();
})();

async function yukleKullaniciAyarlar() {
  try {
    const ayar = await api('GET', '/ayarlar');
    _kullaniciAyarlar = ayar;
    if (!ayar.kurulum_tamamlandi) {
      setTimeout(() => modalKurulumSihirbazi(), 600);
    }
  } catch(e) {}
}

// ─── AĞ BİLGİLERİNİ GÖSTER (KALDIRILDI) ─────────────────────────────────────
async function gosterAgBilgileri() { /* Bildirim kaldırıldı */ }

// ─── KURULUM SİHİRBAZI ───────────────────────────────────────────────────────
let _setupLogoData = null;
let _setupBayrakData = null;

function modalKurulumSihirbazi() {
  _setupLogoData = null;
  _setupBayrakData = null;
  openModal('Hoş Geldiniz! Kurulum', `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:36px;margin-bottom:6px">🎉</div>
      <div style="font-size:14px;color:var(--text2)">Yazdırma şablonunuz için görselleri yükleyin.</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
      <div class="form-group">
        <label><i class="fa-solid fa-image"></i> Logonuz <span style="color:var(--text3);font-weight:400">(Orta + Bağışçı sol üst)</span></label>
        <div class="upload-zone" style="padding:16px;text-align:center;cursor:pointer;min-height:90px;display:flex;align-items:center;justify-content:center" onclick="document.getElementById('setup-logo-input').click()">
          <div id="setup-logo-preview">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:22px;color:var(--text3)"></i>
            <div style="color:var(--text3);font-size:12px;margin-top:4px">Logo yükle</div>
          </div>
        </div>
        <input type="file" id="setup-logo-input" accept="image/*" style="display:none" onchange="onSetupImageChange(this,'logo')"/>
      </div>
      <div class="form-group">
        <label><i class="fa-solid fa-flag"></i> Sağ Üst Bayrak <span style="color:var(--text3);font-weight:400">(Kurban yazdır)</span></label>
        <div class="upload-zone" style="padding:16px;text-align:center;cursor:pointer;min-height:90px;display:flex;align-items:center;justify-content:center" onclick="document.getElementById('setup-bayrak-input').click()">
          <div id="setup-bayrak-preview">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:22px;color:var(--text3)"></i>
            <div style="color:var(--text3);font-size:12px;margin-top:4px">Bayrak yükle</div>
          </div>
        </div>
        <input type="file" id="setup-bayrak-input" accept="image/*" style="display:none" onchange="onSetupImageChange(this,'bayrak')"/>
      </div>
    </div>
    <div style="background:var(--bg4);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text3);line-height:1.7">
      <i class="fa-solid fa-info-circle" style="color:var(--accent)"></i>
      <strong>Kurban yazdır:</strong> Sol üst = Türk Bayrağı (sabit) &nbsp;|&nbsp; Orta = Logonuz &nbsp;|&nbsp; Sağ üst = Yüklediğiniz bayrak<br>
      <i class="fa-solid fa-info-circle" style="color:var(--accent)"></i>
      <strong>Bağışçı listesi:</strong> Sol üst = Logonuz &nbsp;|&nbsp; Ayarlardan sonradan değiştirilebilir
    </div>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn btn-secondary" onclick="kurulumAtla()">Şimdi Değil</button>
      <button class="btn btn-primary" onclick="kurulumKaydet()"><i class="fa-solid fa-floppy-disk"></i> Kaydet ve Başla</button>
    </div>
  `, true, 'gear');
}

function onSetupImageChange(input, tip) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    if (tip === 'logo') {
      _setupLogoData = data;
      document.getElementById('setup-logo-preview').innerHTML =
        '<img src="' + data + '" style="max-height:80px;max-width:100%;border-radius:6px;object-fit:contain"/>';
    } else {
      _setupBayrakData = data;
      document.getElementById('setup-bayrak-preview').innerHTML =
        '<img src="' + data + '" style="max-height:80px;max-width:100%;border-radius:6px;object-fit:contain"/>';
    }
  };
  reader.readAsDataURL(file);
}

async function kurulumKaydet() {
  try {
    const logo = _setupLogoData || _kullaniciAyarlar.logo_data;
    const bayrak = _setupBayrakData || _kullaniciAyarlar.bayrak_data;
    await api('POST', '/ayarlar', { logo_data: logo, bayrak_data: bayrak, kurulum_tamamlandi: 1 });
    _kullaniciAyarlar.logo_data = logo;
    _kullaniciAyarlar.bayrak_data = bayrak;
    _kullaniciAyarlar.kurulum_tamamlandi = 1;
    closeModal();
    toast('Ayarlar kaydedildi');
  } catch(e) { toast(e.message, 'error'); }
}

async function kurulumAtla() {
  try {
    await api('POST', '/ayarlar', { kurulum_tamamlandi: 1 });
    _kullaniciAyarlar.kurulum_tamamlandi = 1;
  } catch(e) {}
  closeModal();
}

// Ayarlar sayfasından da değiştirilebilir
async function modalAyarlar() {
  _setupLogoData = null;
  _setupBayrakData = null;
  const logoOnizleme = _kullaniciAyarlar.logo_data
    ? '<img src="' + _kullaniciAyarlar.logo_data + '" style="max-height:70px;max-width:100%;border-radius:6px;object-fit:contain"/>'
    : '<i class="fa-solid fa-image" style="font-size:22px;color:var(--text3)"></i><div style="color:var(--text3);font-size:12px;margin-top:4px">Yüklenmedi</div>';
  const bayrakOnizleme = _kullaniciAyarlar.bayrak_data
    ? '<img src="' + _kullaniciAyarlar.bayrak_data + '" style="max-height:70px;max-width:100%;border-radius:6px;object-fit:contain"/>'
    : '<i class="fa-solid fa-flag" style="font-size:22px;color:var(--text3)"></i><div style="color:var(--text3);font-size:12px;margin-top:4px">Yüklenmedi</div>';

  openModal('Yazdırma Ayarları', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
      <div class="form-group">
        <label><i class="fa-solid fa-image"></i> Logonuz</label>
        <div class="upload-zone" style="padding:16px;text-align:center;cursor:pointer;min-height:90px;display:flex;align-items:center;justify-content:center" onclick="document.getElementById('setup-logo-input').click()">
          <div id="setup-logo-preview">${logoOnizleme}</div>
        </div>
        <input type="file" id="setup-logo-input" accept="image/*" style="display:none" onchange="onSetupImageChange(this,'logo')"/>
      </div>
      <div class="form-group">
        <label><i class="fa-solid fa-flag"></i> Sağ Üst Bayrak</label>
        <div class="upload-zone" style="padding:16px;text-align:center;cursor:pointer;min-height:90px;display:flex;align-items:center;justify-content:center" onclick="document.getElementById('setup-bayrak-input').click()">
          <div id="setup-bayrak-preview">${bayrakOnizleme}</div>
        </div>
        <input type="file" id="setup-bayrak-input" accept="image/*" style="display:none" onchange="onSetupImageChange(this,'bayrak')"/>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="kurulumKaydet()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>
  `, true, 'gear');
}

// ─── STATE ───────────────────────────────────────────────────────────────────
const S = { page:'organizasyonlar', orgId:null, orgAd:'', orgYil:'' };

const KURBAN_TURLERI = ['Udhiye','Adak','Akika','Vacip','Hedy','Sukur','Kiran','Temmettu','Ceza','Ihsar','Sadaka','Nafile','Olu','Kefaret','Sifa','Hacet','Fidye','Zekat','Nesike','Vesile','Atire'];

function kurbanTuruOptions(secili) {
  return KURBAN_TURLERI.map(t => '<option value="' + t + '"' + (secili===t?' selected':'') + '>' + t + '</option>').join('');
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function api(method, url, body) {
  const opts = { method, headers:{'Content-Type':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('/api' + url, opts);
  const d = await r.json();
  if (!r.ok) throw new Error(d.hata || 'Hata olustu');
  return d;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function toast(msg, type='success') {
  const c = document.getElementById('toast-container');
  if (!c) {
    console.warn('toast-container not found, using console:', msg);
    return;
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid fa-${type==='success'?'circle-check':'circle-xmark'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(title, html, large=false, icon='') {
  document.getElementById('modal-title').innerHTML = `${icon?`<i class="fa-solid fa-${icon}"></i>`:''}${title}`;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-box').className = large ? 'modal modal-lg' : 'modal';
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModalOutside(e) { if (e.target===document.getElementById('modal-overlay')) closeModal(); }

// ─── NAV ─────────────────────────────────────────────────────────────────────
function showPage(page) {
  S.page = page;
  document.querySelectorAll('.sidebar-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page));
  document.getElementById('main-content').innerHTML = '';
  if (page==='organizasyonlar' || page==='kurban-organizasyonu') renderOrganizasyonlar();
  else if (page==='kurbanlar')   renderKurbanlar();
  else if (page==='bagiscilar')  renderBagiscilar();
  else if (page==='raporlar')    renderRaporlar();
  else if (page==='hissedar-raporlari') renderHissedarRaporlari();
  else if (page==='su-kuyusu-raporlari') renderSuKuyusuRaporlari();
  else if (page==='bagisci-raporlari') renderBagisciRaporlari();
  else if (page==='ihtiyac-sahibi-raporlari') renderIhtiyacSahibiRaporlari();
  else if (page==='tahsilat-raporlari') renderTahsilatRaporlari();
  else if (page==='banka-servisleri') renderBankaServisleri();
  else if (page==='sponsor-periyot-raporlari') renderSponsorPeriyotRaporlari();
  else if (page==='profil-bilgilerim') renderProfilBilgilerim();
  else if (page==='ozel-mesajlar') renderOzelMesajlar();
  else if (page==='gorev-bildirimlerim') renderGorevBildirimlerim();
  else if (page==='destek') renderDestekHatti();
  else if (page==='cop')         renderCopKutusu();
  else if (page==='yedek')       renderYedekGeriYukle();
  else if (page==='denetim')     renderDenetim();
  else if (page==='medya')       renderMedyaDeposu();
  else if (page==='bagis-turleri') renderBagisTurleri();
  else if (page==='bagis-raporlari') renderBagisRaporlari();
  else if (page==='bagisci-yonetimi') renderBagisciYonetimi();
  else if (page==='bagis-al') renderBagisAl();
  else if (page==='gonullu-yonetimi') renderGonulluYonetimi();
  else if (page==='kumbara-talepleri') renderKumbaraTalepleri();
  else if (page==='web-sitesi-bagislari') renderWebSitesiBagislari();
  else if (page==='kategori-tanimlari') renderKategoriTanimlari();
  else if (page==='urun-tanimlari') renderUrunTanimlari();
  else if (page==='stok-girisi') renderStokGirisi();
  else if (page==='stok-cikisi') renderStokCikisi();
  else if (page==='fatura-raporlari') renderFaturaRaporlari();
  else if (page==='depo-sayimi') renderDepoSayimi();
  else if (page==='yardim-raporlari') renderYardimRaporlari();
  else if (page==='basvuru-dosyalari') renderBasvuruDosyalari();
  else if (page==='yetim-oksuz-yonetimi') renderYetimOksuzYonetimi();
  else if (page==='ihtiyac-sahibi-listesi') renderIhtiyacSahibiListesi();
  else if (page==='su-kuyusu-organizasyonu') renderSuKuyusuOrganizasyonu();
  else if (page==='proje-yonetimi') renderProjeYonetimi();
  else if (page==='diger-organizasyonlar') renderDigerOrganizasyonlar();
  else if (page==='partner-kurum-listesi') renderPartnerKurumListesi();
}

function toggleBagisMenu() {
  const submenu = document.getElementById('bagis-submenu');
  const chevron = document.getElementById('bagis-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
    setTimeout(() => submenu.scrollIntoView({behavior:'smooth', block:'nearest'}), 50);
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function toggleDepoStokMenu() {
  const submenu = document.getElementById('depo-stok-submenu');
  const chevron = document.getElementById('depo-stok-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function toggleYardimMenu() {
  const submenu = document.getElementById('yardim-submenu');
  const chevron = document.getElementById('yardim-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function toggleOrganizasyonMenu() {
  const submenu = document.getElementById('organizasyon-submenu');
  const chevron = document.getElementById('organizasyon-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function toggleRaporlarMenu() {
  const submenu = document.getElementById('raporlar-submenu');
  const chevron = document.getElementById('raporlar-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function toggleKisiselMenu() {
  const submenu = document.getElementById('kisisel-submenu');
  const chevron = document.getElementById('kisisel-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function togglePartnerMenu() {
  const submenu = document.getElementById('partner-submenu');
  const chevron = document.getElementById('partner-chevron');
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function setSidebarOrg(ad, yil) {
  document.getElementById('sidebar-org-name').textContent = ad || 'Organizasyon Seçilmedi';
  document.getElementById('sidebar-org-sub').textContent  = yil ? `${yil} Yılı` : 'Bir organizasyon seçin';
}

// ─── YARDIMCI ────────────────────────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function para(v) { return v ? Number(v).toLocaleString('tr-TR') + ' TL' : '-'; }

// ═══════════════════════════════════════════════════════════════════════════
// ORGANİZASYONLAR
// ═══════════════════════════════════════════════════════════════════════════
async function renderOrganizasyonlar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-layer-group"></i></div>
        Organizasyonlar
      </div>
      <button class="btn btn-primary" onclick="modalYeniOrg()">
        <i class="fa-solid fa-plus"></i> Yeni Organizasyon
      </button>
    </div>
    <div class="org-grid" id="org-grid">
      <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yukleniyor...</p></div>
    </div>`;
  const list = await api('GET','/organizasyonlar');
  const g = document.getElementById('org-grid');
  if (!list.length) {
    g.innerHTML = `<div class="empty-state"><i class="fa-solid fa-layer-group"></i><p>Henuz organizasyon yok.</p></div>`;
    return;
  }
  g.innerHTML = list.map(o => `
    <div class="org-card" onclick="secOrg(${o.id},'${esc(o.ad)}',${o.yil})">
      <div class="org-card-name">${esc(o.ad)}</div>
      <div class="org-card-year"><i class="fa-solid fa-calendar"></i> ${o.yil} &nbsp;|&nbsp; Maks. ${o.max_kurban} Kurban</div>
      <div class="org-card-stats">
        <div class="org-card-stat"><div class="val">${o.max_kurban}</div><div class="lbl">Kapasite</div></div>
        <div class="org-card-stat"><div class="val" style="color:var(--green)">${para(o.buyukbas_hisse_fiyati)}</div><div class="lbl">Buyukbas</div></div>
        <div class="org-card-stat"><div class="val" style="color:var(--yellow)">${para(o.kucukbas_hisse_fiyati)}</div><div class="lbl">Kucukbas</div></div>
      </div>
      <div class="org-card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-secondary btn-sm" onclick="modalDuzenleOrg(${o.id})"><i class="fa-solid fa-pen"></i> Duzenle</button>
        <button class="btn btn-danger btn-sm" onclick="silOrg(${o.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function secOrg(id, ad, yil) {
  S.orgId=id; S.orgAd=ad; S.orgYil=yil;
  setSidebarOrg(ad, yil);
  showPage('kurbanlar');
}

function modalYeniOrg() {
  openModal('Yeni Organizasyon Olustur', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Organizasyon Adi *</label>
        <input id="fo-ad" placeholder="Ornek: 2025 Kurban Organizasyonu"/>
      </div>
      <div class="form-group">
        <label>Yil *</label>
        <input id="fo-yil" type="number" value="${new Date().getFullYear()}"/>
      </div>
      <div class="form-group">
        <label>Maksimum Kurban Sayisi *</label>
        <input id="fo-max" type="number" placeholder="50"/>
      </div>
      <div class="form-group">
        <label>Buyukbas Hisse Fiyati (TL)</label>
        <input id="fo-bb" type="number" placeholder="0"/>
      </div>
      <div class="form-group">
        <label>Kucukbas Hisse Fiyati (TL)</label>
        <input id="fo-kb" type="number" placeholder="0"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Aciklama</label>
        <textarea id="fo-aciklama" placeholder="Opsiyonel..."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
      <button class="btn btn-primary" onclick="kaydetOrg()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`, false, 'layer-group');
}

async function kaydetOrg() {
  const ad=document.getElementById('fo-ad').value.trim();
  const yil=parseInt(document.getElementById('fo-yil').value);
  const max_kurban=parseInt(document.getElementById('fo-max').value);
  const buyukbas_hisse_fiyati=parseFloat(document.getElementById('fo-bb').value)||0;
  const kucukbas_hisse_fiyati=parseFloat(document.getElementById('fo-kb').value)||0;
  const aciklama=document.getElementById('fo-aciklama').value.trim();
  if (!ad||!yil||!max_kurban) return toast('Zorunlu alanlar eksik','error');
  try {
    await api('POST','/organizasyonlar',{ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama});
    closeModal(); toast('Organizasyon olusturuldu'); renderOrganizasyonlar();
  } catch(e) { toast(e.message,'error'); }
}

async function modalDuzenleOrg(id) {
  const list = await api('GET','/organizasyonlar');
  const o = list.find(x=>x.id===id); if (!o) return;
  openModal('Organizasyonu Duzenle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Organizasyon Adi *</label>
        <input id="fo-ad" value="${esc(o.ad)}"/>
      </div>
      <div class="form-group"><label>Yil *</label><input id="fo-yil" type="number" value="${o.yil}"/></div>
      <div class="form-group"><label>Maks. Kurban *</label><input id="fo-max" type="number" value="${o.max_kurban}"/></div>
      <div class="form-group"><label>Buyukbas Hisse (TL)</label><input id="fo-bb" type="number" value="${o.buyukbas_hisse_fiyati}"/></div>
      <div class="form-group"><label>Kucukbas Hisse (TL)</label><input id="fo-kb" type="number" value="${o.kucukbas_hisse_fiyati}"/></div>
      <div class="form-group" style="grid-column:1/-1"><label>Aciklama</label><textarea id="fo-aciklama">${esc(o.aciklama||'')}</textarea></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
      <button class="btn btn-primary" onclick="guncOrg(${id})"><i class="fa-solid fa-floppy-disk"></i> Guncelle</button>
    </div>`, false, 'pen');
}

async function guncOrg(id) {
  const ad=document.getElementById('fo-ad').value.trim();
  const yil=parseInt(document.getElementById('fo-yil').value);
  const max_kurban=parseInt(document.getElementById('fo-max').value);
  const buyukbas_hisse_fiyati=parseFloat(document.getElementById('fo-bb').value)||0;
  const kucukbas_hisse_fiyati=parseFloat(document.getElementById('fo-kb').value)||0;
  const aciklama=document.getElementById('fo-aciklama').value.trim();
  try {
    await api('PUT',`/organizasyonlar/${id}`,{ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati,aciklama});
    closeModal(); toast('Guncellendi'); renderOrganizasyonlar();
  } catch(e) { toast(e.message,'error'); }
}

async function silOrg(id) {
  if (!confirm('Bu organizasyonu silmek istediginizden emin misiniz?')) return;
  try { await api('DELETE',`/organizasyonlar/${id}`); toast('Silindi'); renderOrganizasyonlar(); }
  catch(e) { toast(e.message,'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// KURBANLAR
// ═══════════════════════════════════════════════════════════════════════════
let _kurbanlar = [];

async function renderKurbanlar() {
  if (!S.orgId) { showPage('organizasyonlar'); return; }
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-cow"></i></div>
        Kurbanlar <small>${esc(S.orgAd)}</small>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="showPage('organizasyonlar')"><i class="fa-solid fa-arrow-left"></i> Geri</button>
        <div style="position:relative">
          <button class="btn btn-secondary" onclick="togglePrintMenu(event)">
            <i class="fa-solid fa-print"></i> Yazdırma Seçenekleri
            <i class="fa-solid fa-chevron-down" style="margin-left:6px;font-size:10px"></i>
          </button>
          <div id="print-menu" class="dropdown-menu" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:200px;z-index:1000">
            <div onclick="tumKurbanlariYazdir()" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s" onmouseover="this.style.background='var(--hover-bg)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-print" style="width:20px;color:var(--accent)"></i>
              <span>Tümünü Yazdır</span>
            </div>
            <div onclick="tumKurbanlariExcel()" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s" onmouseover="this.style.background='var(--hover-bg)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-file-excel" style="width:20px;color:var(--green)"></i>
              <span>Excel İndir</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" onclick="modalYeniKurban()"><i class="fa-solid fa-plus"></i> Kurban Ekle</button>
      </div>
    </div>
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input id="k-ara" placeholder="Kurban no ara..." oninput="filterKurbanlar()"/>
        <select id="k-tur" onchange="loadKurbanlar()">
          <option value="">Tum Turler</option>
          <option value="buyukbas">Buyukbas</option>
          <option value="kucukbas">Kucukbas</option>
        </select>
        <select id="k-durum" onchange="loadKurbanlar()">
          <option value="">Tum Durumlar</option>
          <option value="bos">Bos Hisseli</option>
          <option value="doldu">Hisseleri Dolu</option>
          <option value="kesildi">Kesildi</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th style="width:40px">#</th>
            <th data-sort="kurban_no" onclick="sortKurbanlar('kurban_no')" style="cursor:pointer">No<span class="sort-icon"> ↑</span></th>
            <th data-sort="tur" onclick="sortKurbanlar('tur')" style="cursor:pointer">Hayvan<span class="sort-icon"> ↕</span></th>
            <th>Kupe No</th>
            <th data-sort="alis_fiyati" onclick="sortKurbanlar('alis_fiyati')" style="cursor:pointer">Alis Fiyati<span class="sort-icon"> ↕</span></th>
            <th data-sort="dolu_hisse" onclick="sortKurbanlar('dolu_hisse')" style="cursor:pointer">Hisse Durumu<span class="sort-icon"> ↕</span></th>
            <th>Durum</th>
            <th>Kesim</th>
            <th>Islemler</th>
          </tr></thead>
          <tbody id="kurban-tbody"></tbody>
        </table>
      </div>
    </div>`;
  await loadKurbanlar();
}

async function loadKurbanlar() {
  const tur = document.getElementById('k-tur')?.value||'';
  const durum = document.getElementById('k-durum')?.value||'';
  let url = `/organizasyonlar/${S.orgId}/kurbanlar?`;
  if (tur) url+=`tur=${tur}&`;
  if (durum) url+=`durum=${durum}`;
  _kurbanlar = await api('GET', url);
  filterKurbanlar();
}

let _sortCol = 'kurban_no', _sortDir = 1;

function sortKurbanlar(col) {
  if (_sortCol === col) _sortDir *= -1;
  else { _sortCol = col; _sortDir = 1; }
  // Başlık oklarını güncelle
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.querySelector('.sort-icon').textContent = th.dataset.sort === _sortCol ? (_sortDir===1?' ↑':' ↓') : ' ↕';
  });
  filterKurbanlar();
}

function filterKurbanlar() {
  const ara = (document.getElementById('k-ara')?.value||'').toLowerCase();
  let list = _kurbanlar.filter(k => !ara || String(k.kurban_no).includes(ara) || (k.kupe_no||'').toLowerCase().includes(ara));

  // Sırala
  list = [...list].sort((a,b) => {
    let av = a[_sortCol], bv = b[_sortCol];
    if (typeof av === 'string') av = av.toLowerCase(), bv = (bv||'').toLowerCase();
    if (av == null) av = -1; if (bv == null) bv = -1;
    return av > bv ? _sortDir : av < bv ? -_sortDir : 0;
  });

  const tbody = document.getElementById('kurban-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-cow"></i><p>Kurban bulunamadi.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((k, idx) => {
    const dolu = k.dolu_hisse, top = k.toplam_hisse;
    const pct = Math.round((dolu/top)*100);
    let durumBadge;
    if (k.kesildi) durumBadge = `<span class="badge badge-red"><i class="fa-solid fa-scissors"></i> Kesildi</span>`;
    else if (dolu>=top) durumBadge = `<span class="badge badge-yellow"><i class="fa-solid fa-circle-dot"></i> Doldu</span>`;
    else durumBadge = `<span class="badge badge-green"><i class="fa-solid fa-circle"></i> Bos</span>`;
    return `<tr>
      <td style="color:var(--text3);font-size:12px;font-weight:600">${idx+1}</td>
      <td><span class="kurban-no-badge">${k.kurban_no}</span></td>
      <td>${k.tur==='buyukbas'?'<span class="badge badge-blue"><i class="fa-solid fa-cow"></i> Buyukbas</span>':'<span class="badge badge-gray"><i class="fa-solid fa-hippo"></i> Kucukbas</span>'}</td>
      <td>${k.kupe_no?esc(k.kupe_no):'<span style="color:var(--text3)">-</span>'}</td>
      <td>${k.alis_fiyati?para(k.alis_fiyati):'-'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;min-width:120px">
          <div class="progress-bar" style="flex:1"><div class="progress-fill ${dolu>=top?'full':''}" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--text2);font-weight:600">${dolu}/${top}</span>
        </div>
      </td>
      <td>${durumBadge}</td>
      <td>${k.kesim_tarihi?`<span style="font-size:12px">${k.kesim_tarihi}</span>`:'<span style="color:var(--text3)">-</span>'}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-purple btn-sm" onclick="modalHisseler(${k.id},${k.kurban_no},'${k.tur}')"><i class="fa-solid fa-users"></i> Hisseler</button>
          <button class="btn btn-secondary btn-sm btn-icon" title="Yazdır" onclick="modalYazdirSecim(${k.id}, ${k.kurban_no}, '${k.tur}')"><i class="fa-solid fa-print"></i></button>
          <button class="btn btn-green btn-sm btn-icon" title="Excel İndir" onclick="excelIndirKurbanSatir(${k.id})"><i class="fa-solid fa-file-excel"></i></button>
          <button class="btn btn-secondary btn-sm btn-icon" title="Duzenle" onclick="modalDuzenleKurban(${k.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="silKurban(${k.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function modalYeniKurban() {
  openModal('Yeni Kurban Ekle', `
    <div class="form-grid">
      <div class="form-group">
        <label>Hayvan Turu *</label>
        <select id="fk-tur">
          <option value="buyukbas">Buyukbas (7 Hisse)</option>
          <option value="kucukbas">Kucukbas (1 Hisse)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Kurban Turu *</label>
        <select id="fk-kurban-turu">${kurbanTuruOptions('Udhiye')}</select>
      </div>
      <div class="form-group">
        <label>Kupe No</label>
        <input id="fk-kupe" placeholder="Opsiyonel"/>
      </div>
      <div class="form-group">
        <label>Alis Fiyati (TL)</label>
        <input id="fk-alis" type="number" placeholder="0"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Kesen Kisi Adi Soyadi <span style="color:var(--text3);font-weight:400">(Opsiyonel)</span></label>
        <input id="fk-kesen" placeholder="Kurbani kesecek kisi"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Not</label>
        <textarea id="fk-not" placeholder="Opsiyonel..."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
      <button class="btn btn-primary" onclick="kaydetKurban()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`, false, 'cow');
}

async function kaydetKurban() {
  const tur=document.getElementById('fk-tur').value;
  const kurban_turu=document.getElementById('fk-kurban-turu').value;
  const kupe_no=document.getElementById('fk-kupe').value.trim();
  const alis_fiyati=parseFloat(document.getElementById('fk-alis').value)||0;
  const kesen_kisi=document.getElementById('fk-kesen').value.trim();
  const aciklama=document.getElementById('fk-not').value.trim();
  try {
    const r = await api('POST',`/organizasyonlar/${S.orgId}/kurbanlar`,{tur,kurban_turu,kupe_no,alis_fiyati,kesen_kisi,aciklama});
    closeModal(); toast(`Kurban #${r.kurban_no} olusturuldu (${r.toplam_hisse} hisse)`);
    await loadDashStats(); await loadKurbanlar();
  } catch(e) { toast(e.message,'error'); }
}

async function modalDuzenleKurban(id) {
  const k = _kurbanlar.find(x=>x.id===id); if (!k) return;
  openModal(`Kurban #${k.kurban_no} Duzenle`, `
    <div class="form-grid">
      <div class="form-group">
        <label>Kurban Turu</label>
        <select id="fk-kurban-turu">${kurbanTuruOptions(k.kurban_turu||'Udhiye')}</select>
      </div>
      <div class="form-group">
        <label>Kupe No</label>
        <input id="fk-kupe" value="${esc(k.kupe_no||'')}"/>
      </div>
      <div class="form-group">
        <label>Alis Fiyati (TL)</label>
        <input id="fk-alis" type="number" value="${k.alis_fiyati||0}"/>
      </div>
      <div class="form-group">
        <label>Kesildi mi?</label>
        <select id="fk-kesildi">
          <option value="0" ${!k.kesildi?'selected':''}>Hayir</option>
          <option value="1" ${k.kesildi?'selected':''}>Evet</option>
        </select>
      </div>
      <div class="form-group">
        <label>Kesim Tarihi</label>
        <input id="fk-kesim" type="date" value="${k.kesim_tarihi||''}"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Kesen Kisi Adi Soyadi</label>
        <input id="fk-kesen" value="${esc(k.kesen_kisi||'')}" placeholder="Opsiyonel"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Not</label>
        <textarea id="fk-not">${esc(k.aciklama||'')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
      <button class="btn btn-primary" onclick="guncKurban(${id})"><i class="fa-solid fa-floppy-disk"></i> Guncelle</button>
    </div>`, false, 'pen');
}

async function guncKurban(id) {
  const kurban_turu=document.getElementById('fk-kurban-turu').value;
  const kupe_no=document.getElementById('fk-kupe').value.trim();
  const alis_fiyati=parseFloat(document.getElementById('fk-alis').value)||0;
  const kesildi=document.getElementById('fk-kesildi').value==='1';
  const kesim_tarihi=document.getElementById('fk-kesim').value;
  const kesen_kisi=document.getElementById('fk-kesen').value.trim();
  const aciklama=document.getElementById('fk-not').value.trim();
  try {
    await api('PUT',`/kurbanlar/${id}`,{kurban_turu,kupe_no,alis_fiyati,kesildi,kesim_tarihi,kesen_kisi,aciklama});
    closeModal(); toast('Guncellendi'); await loadDashStats(); await loadKurbanlar();
  } catch(e) { toast(e.message,'error'); }
}

async function silKurban(id) {
  if (!confirm('Bu kurbani silmek istediginizden emin misiniz?')) return;
  try { await api('DELETE',`/kurbanlar/${id}`); toast('Silindi'); await loadDashStats(); await loadKurbanlar(); }
  catch(e) { toast(e.message,'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// HİSSELER / BAĞIŞÇI EKLEME
// ═══════════════════════════════════════════════════════════════════════════
async function modalHisseler(kurbanId, kurbanNo, tur) {
  const hisseler = await api('GET',`/kurbanlar/${kurbanId}/hisseler`);
  const dolu = hisseler.filter(h=>h.bagisci_adi).length;
  const html = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <span class="badge ${tur==='buyukbas'?'badge-blue':'badge-gray'}">${tur==='buyukbas'?'Buyukbas':'Kucukbas'}</span>
      <span style="font-size:13px;color:var(--text2)">${dolu}/${hisseler.length} hisse dolu</span>
      <div class="progress-bar" style="flex:1;max-width:120px">
        <div class="progress-fill ${dolu>=hisseler.length?'full':''}" style="width:${Math.round(dolu/hisseler.length*100)}%"></div>
      </div>
    </div>
    <div class="hisse-grid">
      ${hisseler.map(h => hisseKart(h, kurbanId)).join('')}
    </div>`;
  openModal(`Kurban #${kurbanNo} — Hisseler`, html, true, 'users');
}

function hisseKart(h, kurbanId) {
  const dolu = !!h.bagisci_adi;
  const odemeRenk = {odendi:'badge-green',iptal:'badge-red',bekliyor:'badge-gray'};
  const odemeLabel = {odendi:'Odendi',iptal:'Iptal',bekliyor:'Bekliyor'};
  return `
    <div class="hisse-card ${dolu?'dolu':''}" onclick="modalBagisciDuzenle(${h.id},${kurbanId})">
      <div class="hisse-no"><i class="fa-solid fa-hashtag"></i> Hisse ${h.hisse_no}</div>
      ${dolu ? `
        <div class="hisse-isim">${esc(h.bagisci_adi)}</div>
        <div class="hisse-tel">${h.bagisci_telefon?esc(h.bagisci_telefon):''}</div>
        ${h.kimin_adina?`<div class="hisse-adina"><i class="fa-solid fa-heart"></i> ${esc(h.kimin_adina)}</div>`:''}
        ${h.video_ister?`<div style="font-size:11px;color:var(--accent);margin-top:4px"><i class="fa-solid fa-video"></i> Video istiyor</div>`:''}
        <div class="hisse-odeme"><span class="badge ${odemeRenk[h.odeme_durumu]||'badge-gray'}" style="font-size:10px">${odemeLabel[h.odeme_durumu]||h.odeme_durumu}</span></div>
        <div style="margin-top:6px" onclick="event.stopPropagation()">
          <button class="btn btn-purple btn-sm" style="font-size:10px;padding:4px 8px" onclick="modalHisseMedya(${h.id},${h.kurban_id||kurbanId},${h.hisse_no})">
            <i class="fa-solid fa-cloud-arrow-up"></i> Medya
          </button>
        </div>
      ` : `
        <div class="hisse-bos"><i class="fa-solid fa-user-plus"></i> Bos — Tikla ekle</div>
      `}    </div>`;
}

async function modalBagisciDuzenle(hisseId, kurbanId) {
  const hisseler = await api('GET',`/kurbanlar/${kurbanId}/hisseler`);
  const h = hisseler.find(x=>x.id===hisseId); if (!h) return;
  const html = `
    <div style="margin-bottom:16px">
      <span class="badge badge-blue" style="font-size:12px"><i class="fa-solid fa-hashtag"></i> Hisse ${h.hisse_no}</span>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Bagisci Adi Soyadi *</label>
        <input id="fh-ad" value="${esc(h.bagisci_adi||'')}" placeholder="Ad Soyad"/>
      </div>
      <div class="form-group">
        <label>Bagisci Telefonu</label>
        <input id="fh-tel" value="${esc(h.bagisci_telefon||'')}" placeholder="05xx xxx xx xx"/>
      </div>
      <div class="form-group">
        <label>Kimin Adina <span style="color:var(--text3);font-weight:400">(Opsiyonel)</span></label>
        <input id="fh-adina" value="${esc(h.kimin_adina||'')}" placeholder="Vefat eden veya baska kisi"/>
      </div>
      <div class="form-group">
        <label>Kimin Adina Telefon <span style="color:var(--text3);font-weight:400">(Opsiyonel)</span></label>
        <input id="fh-adina-tel" value="${esc(h.kimin_adina_telefon||'')}" placeholder="Opsiyonel"/>
      </div>
      <div class="form-group">
        <label>Odeme Durumu</label>
        <select id="fh-odeme">
          <option value="bekliyor" ${h.odeme_durumu==='bekliyor'?'selected':''}>Bekliyor</option>
          <option value="odendi"   ${h.odeme_durumu==='odendi'?'selected':''}>Odendi</option>
          <option value="iptal"    ${h.odeme_durumu==='iptal'?'selected':''}>Iptal</option>
        </select>
      </div>
      <div class="form-group">
        <label>Video Ister mi?</label>
        <select id="fh-video">
          <option value="0" ${!h.video_ister?'selected':''}>Hayir</option>
          <option value="1" ${h.video_ister?'selected':''}>Evet</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Not</label>
        <textarea id="fh-not">${esc(h.aciklama||'')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      ${h.bagisci_adi?`<button class="btn btn-danger" onclick="temizleHisse(${hisseId},${kurbanId})"><i class="fa-solid fa-eraser"></i> Temizle</button>`:''}
      <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
      <button class="btn btn-primary" onclick="kaydetBagisci(${hisseId},${kurbanId})"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`;
  openModal(`Hisse ${h.hisse_no} — Bagisci Bilgileri`, html, false, 'user-pen');
}

async function kaydetBagisci(hisseId, kurbanId) {
  const bagisci_adi = document.getElementById('fh-ad').value.trim();
  const bagisci_telefon = document.getElementById('fh-tel').value.trim();
  const kimin_adina = document.getElementById('fh-adina').value.trim();
  const kimin_adina_telefon = document.getElementById('fh-adina-tel').value.trim();
  const odeme_durumu = document.getElementById('fh-odeme').value;
  const video_ister = document.getElementById('fh-video').value==='1';
  const aciklama = document.getElementById('fh-not').value.trim();
  if (!bagisci_adi) return toast('Bagisci adi zorunlu','error');
  try {
    await api('PUT',`/hisseler/${hisseId}`,{bagisci_adi,bagisci_telefon,kimin_adina,kimin_adina_telefon,odeme_durumu,video_ister,aciklama});
    closeModal(); toast('Bagisci kaydedildi');
    await loadDashStats(); await loadKurbanlar();
  } catch(e) { toast(e.message,'error'); }
}

async function temizleHisse(hisseId, kurbanId) {
  if (!confirm('Bu hisseyi temizlemek istediginizden emin misiniz?')) return;
  try {
    await api('DELETE',`/hisseler/${hisseId}/temizle`);
    closeModal(); toast('Hisse temizlendi');
    await loadDashStats(); await loadKurbanlar();
  } catch(e) { toast(e.message,'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// BAĞIŞÇILAR
// ═══════════════════════════════════════════════════════════════════════════
async function renderBagiscilar() {
  const m = document.getElementById('main-content');
  const orgSmall = S.orgAd ? '<small>' + esc(S.orgAd) + '</small>' : '';
  m.innerHTML =
    '<div class="page-header">' +
      '<div class="page-title"><div class="icon-wrap"><i class="fa-solid fa-users"></i></div>Bagiscilar ' + orgSmall + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<div style="position:relative">' +
          '<button class="btn btn-secondary" onclick="toggleBagisciPrintMenu(event)">' +
            '<i class="fa-solid fa-print"></i> Yazdırma Seçenekleri' +
            '<i class="fa-solid fa-chevron-down" style="margin-left:6px;font-size:10px"></i>' +
          '</button>' +
          '<div id="bagisci-print-menu" class="dropdown-menu" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:200px;z-index:1000">' +
            '<div onclick="yazdirBagiscilar()" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s" onmouseover="this.style.background=\'var(--hover-bg)\'" onmouseout="this.style.background=\'transparent\'">' +
              '<i class="fa-solid fa-print" style="width:20px;color:var(--accent)"></i>' +
              '<span>Yazdır</span>' +
            '</div>' +
            '<div onclick="excelBagiscilarIndir()" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s" onmouseover="this.style.background=\'var(--hover-bg)\'" onmouseout="this.style.background=\'transparent\'">' +
              '<i class="fa-solid fa-file-excel" style="width:20px;color:var(--green)"></i>' +
              '<span>Excel İndir</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="modalYeniBagisci()"><i class="fa-solid fa-user-plus"></i> Bagisci Ekle</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="filter-bar" style="margin-bottom:16px">' +
        '<input id="b-ara" placeholder="Ad veya telefon ile ara..." oninput="aramaBagisci()" style="min-width:300px"/>' +
      '</div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr>' +
            '<th>#</th><th>Bagisci Adi</th><th>Telefon</th><th>Kimin Adina</th>' +
            '<th>Kurban No</th><th>Hisse</th><th>Tur</th><th>Odeme</th><th>Video</th><th>Islem</th>' +
          '</tr></thead>' +
          '<tbody id="bagisci-tbody">' +
            '<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yukleniyor...</p></div></td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  await tumBagiscilariGoster();
}


async function tumBagiscilariGoster() {
  if (!S.orgId) return toast('Once bir organizasyon secin','error');
  let url = `/bagiscilar/ara?q=&orgId=${S.orgId}&tumunu=1`;
  const list = await api('GET', url);
  renderBagisciTablosu(list);
}

async function aramaBagisci() {
  const q = document.getElementById('b-ara').value.trim();
  if (q.length === 0) {
    await tumBagiscilariGoster();
    return;
  }
  if (q.length < 2) return;
  let url = `/bagiscilar/ara?q=${encodeURIComponent(q)}`;
  if (S.orgId) url += `&orgId=${S.orgId}`;
  const list = await api('GET', url);
  renderBagisciTablosu(list);
}

function renderBagisciTablosu(list) {
  const tbody = document.getElementById('bagisci-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-user-slash"></i><p>Sonuc bulunamadi.</p></div></td></tr>`;
    return;
  }
  const oRenk  = {odendi:'badge-green',iptal:'badge-red',bekliyor:'badge-gray'};
  const oLabel = {odendi:'Odendi',iptal:'Iptal',bekliyor:'Bekliyor'};
  tbody.innerHTML = list.map((h,i)=>`
    <tr>
      <td style="color:var(--text3);font-size:12px">${i+1}</td>
      <td><strong>${esc(h.bagisci_adi)}</strong></td>
      <td>${h.bagisci_telefon?esc(h.bagisci_telefon):'-'}</td>
      <td>${h.kimin_adina?`<span style="color:var(--purple)">${esc(h.kimin_adina)}</span>`:'-'}</td>
      <td><span class="kurban-no-badge">${h.kurban_no}</span></td>
      <td><span class="badge badge-blue">${h.hisse_no}</span></td>
      <td>${h.tur==='buyukbas'?'<span class="badge badge-blue">Buyukbas</span>':'<span class="badge badge-gray">Kucukbas</span>'}</td>
      <td><span class="badge ${oRenk[h.odeme_durumu]||'badge-gray'}">${oLabel[h.odeme_durumu]||h.odeme_durumu}</span></td>
      <td>${h.video_ister?'<span class="badge badge-purple"><i class="fa-solid fa-video"></i> Evet</span>':'-'}</td>
      <td><button class="btn btn-secondary btn-sm btn-icon" onclick="modalBagisciDuzenle(${h.id},${h.kurban_id})" title="Duzenle"><i class="fa-solid fa-pen"></i></button></td>
    </tr>`).join('');
}

async function modalYeniBagisci() {
  if (!S.orgId) return toast('Once bir organizasyon secin', 'error');

  // Mevcut kurban sayısını al → yeni kurban no = max + 1
  const kurbanlar = await api('GET', `/organizasyonlar/${S.orgId}/kurbanlar`);
  const org = (await api('GET', '/organizasyonlar')).find(o => o.id === S.orgId);
  const yeniNo = kurbanlar.length + 1;

  if (org && yeniNo > org.max_kurban) return toast('Maksimum kurban sayisina ulasildi', 'error');

  openModal(`Bagisci Ekle — Kurban #${yeniNo}`, `
    <div style="background:var(--bg4);border:1px solid var(--border2);border-radius:10px;padding:14px;margin-bottom:20px">
      <div style="font-size:12px;color:var(--text3);margin-bottom:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Kurban Bilgileri</div>
      <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div class="form-group">
          <label>Hayvan Turu *</label>
          <select id="fb-tur" onchange="bagisciTurSecildi()">
            <option value="buyukbas">Buyukbas (7 Hisse)</option>
            <option value="kucukbas">Kucukbas (1 Hisse)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Kurban Turu *</label>
          <select id="fb-kurban-turu">${kurbanTuruOptions('Udhiye')}</select>
        </div>
        <div class="form-group">
          <label>Kupe No</label>
          <input id="fb-kupe" placeholder="Opsiyonel"/>
        </div>
        <div class="form-group">
          <label>Alis Fiyati (TL)</label>
          <input id="fb-alis" type="number" placeholder="0"/>
        </div>
        <div class="form-group" style="grid-column:3/4">
          <label>Kesen Kisi</label>
          <input id="fb-kesen" placeholder="Opsiyonel"/>
        </div>
      </div>
    </div>

    <div id="fb-hisseler-wrap"></div>

    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
      <button class="btn btn-primary" onclick="kaydetYeniBagisci()">
        <i class="fa-solid fa-floppy-disk"></i> Kurban Olustur ve Kaydet
      </button>
    </div>
  `, true, 'user-plus');

  // Sayfa açılınca hemen büyükbaş için 7 hisse formunu göster
  bagisciTurSecildi();
}

function bagisciTurSecildi() {
  const tur = document.getElementById('fb-tur')?.value || 'buyukbas';
  const toplam = tur === 'buyukbas' ? 7 : 1;
  const wrap = document.getElementById('fb-hisseler-wrap');
  if (!wrap) return;

  let html = '<div style="font-size:12px;color:var(--text3);margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">';
  html += '<i class="fa-solid fa-users" style="color:var(--accent)"></i> Hisseler (' + toplam + ' Hisse)</div>';

  for (let no = 1; no <= toplam; no++) {
    html += '<div style="background:var(--bg4);border:1px solid var(--border2);border-radius:10px;padding:14px;margin-bottom:10px" id="fb-hisse-block-' + no + '">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
    html += '<span class="badge badge-blue"><i class="fa-solid fa-hashtag"></i> Hisse ' + no + '</span>';
    html += '<span style="font-size:11px;color:var(--text3)" id="fb-hisse-durum-' + no + '">Bos</span>';
    html += '</div>';
    html += '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">';
    html += '<div class="form-group"><label>Bagisci Adi Soyadi</label>';
    html += '<input id="fb-ad-' + no + '" placeholder="Ad Soyad" oninput="bagisciAdGirildi(' + no + ')"/></div>';
    html += '<div class="form-group"><label>Telefon</label>';
    html += '<input id="fb-tel-' + no + '" placeholder="05xx xxx xx xx"/></div>';
    html += '<div class="form-group"><label>Kimin Adina <span style="color:var(--text3);font-weight:400">(Opsiyonel)</span></label>';
    html += '<input id="fb-adina-' + no + '" placeholder="Vefat eden / baska kisi"/></div>';
    html += '<div class="form-group"><label>Kimin Adina Tel <span style="color:var(--text3);font-weight:400">(Opsiyonel)</span></label>';
    html += '<input id="fb-adina-tel-' + no + '" placeholder="Opsiyonel"/></div>';
    html += '<div class="form-group"><label>Odeme Durumu</label>';
    html += '<select id="fb-odeme-' + no + '"><option value="bekliyor">Bekliyor</option><option value="odendi">Odendi</option><option value="iptal">Iptal</option></select></div>';
    html += '<div class="form-group"><label>Video Ister mi?</label>';
    html += '<select id="fb-video-' + no + '"><option value="0">Hayir</option><option value="1">Evet</option></select></div>';
    html += '</div></div>';
  }

  wrap.innerHTML = html;
  wrap.dataset.toplam = toplam;
}

function bagisciAdGirildi(no) {
  const ad = document.getElementById(`fb-ad-${no}`)?.value.trim();
  const durum = document.getElementById(`fb-hisse-durum-${no}`);
  const block = document.getElementById(`fb-hisse-block-${no}`);
  if (ad) {
    durum.textContent = ad;
    durum.style.color = 'var(--green)';
    block.style.borderColor = 'rgba(16,185,129,0.4)';
    block.style.background = 'rgba(16,185,129,0.05)';
  } else {
    durum.textContent = 'Bos';
    durum.style.color = 'var(--text3)';
    block.style.borderColor = 'var(--border2)';
    block.style.background = 'var(--bg4)';
  }
}

async function kaydetYeniBagisci() {
  const tur = document.getElementById('fb-tur').value;
  const kurban_turu = document.getElementById('fb-kurban-turu').value;
  const kupe_no = document.getElementById('fb-kupe').value.trim();
  const alis_fiyati = parseFloat(document.getElementById('fb-alis').value) || 0;
  const kesen_kisi = document.getElementById('fb-kesen').value.trim();
  const toplam = parseInt(document.getElementById('fb-hisseler-wrap').dataset.toplam || '7');

  // Hisse verilerini topla
  const hisseler = [];
  for (let i = 1; i <= toplam; i++) {
    hisseler.push({
      bagisci_adi:        document.getElementById(`fb-ad-${i}`)?.value.trim() || '',
      bagisci_telefon:    document.getElementById(`fb-tel-${i}`)?.value.trim() || '',
      kimin_adina:        document.getElementById(`fb-adina-${i}`)?.value.trim() || '',
      kimin_adina_telefon:document.getElementById(`fb-adina-tel-${i}`)?.value.trim() || '',
      odeme_durumu:       document.getElementById(`fb-odeme-${i}`)?.value || 'bekliyor',
      video_ister:        document.getElementById(`fb-video-${i}`)?.value === '1',
    });
  }

  const doluSayi = hisseler.filter(h => h.bagisci_adi).length;
  if (doluSayi === 0) return toast('En az 1 hisseye bagisci adi girin', 'error');

  try {
    const r = await api('POST', `/organizasyonlar/${S.orgId}/kurban-ve-hisseler`, {
      tur, kurban_turu, kupe_no, alis_fiyati, kesen_kisi, hisseler
    });
    closeModal();
    toast(`Kurban #${r.kurban_no} olusturuldu — ${doluSayi} bagisci kaydedildi`);
    await loadDashStats();
    await loadKurbanlar();
    tumBagiscilariGoster();
  } catch(e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// RAPORLAR
// ═══════════════════════════════════════════════════════════════════════════
async function renderRaporlar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-chart-bar"></i></div>
        Raporlar & Yazdırma
        ${S.orgAd ? '<small>' + esc(S.orgAd) + '</small>' : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="position:relative">
          <button class="btn btn-secondary" onclick="toggleRaporPrintMenu(event)">
            <i class="fa-solid fa-print"></i> Yazdırma Seçenekleri
            <i class="fa-solid fa-chevron-down" style="margin-left:6px;font-size:10px"></i>
          </button>
          <div id="rapor-print-menu" class="dropdown-menu" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:220px;z-index:1000">
            <div onclick="yazdir('tum')" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s" onmouseover="this.style.background='var(--hover-bg)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-print" style="width:20px;color:var(--accent)"></i>
              <span>Tüm Raporu Yazdır</span>
            </div>
            <div onclick="excelIndir()" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.2s" onmouseover="this.style.background='var(--hover-bg)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-file-excel" style="width:20px;color:var(--green)"></i>
              <span>Excel İndir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="rapor-icerik"><div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yukleniyor...</p></div></div>`;

  if (!S.orgId) {
    document.getElementById('rapor-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-layer-group"></i><p>Once bir organizasyon secin.</p></div>';
    return;
  }
  await yukleRapor();
}

async function yukleRapor() {
  const d = await api('GET', '/organizasyonlar/' + S.orgId + '/rapor');
  const { org, kurbanlar, hisseler, ozet } = d;

  let html = '';

  // Özet kartlar
  html += '<div class="stats-grid" style="margin-bottom:20px">';
  html += '<div class="stat-card blue"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">' + ozet.toplam_kurban + '</div><div class="stat-label">Toplam Kurban</div></div>';
  html += '<div class="stat-card blue"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">' + ozet.buyukbas + '</div><div class="stat-label">Buyukbas</div></div>';
  html += '<div class="stat-card yellow"><div class="stat-icon"><i class="fa-solid fa-hippo"></i></div><div class="stat-value">' + ozet.kucukbas + '</div><div class="stat-label">Kucukbas</div></div>';
  html += '<div class="stat-card green"><div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div><div class="stat-value">' + ozet.dolu_hisse + '</div><div class="stat-label">Dolu Hisse</div></div>';
  html += '<div class="stat-card yellow"><div class="stat-icon"><i class="fa-solid fa-circle-half-stroke"></i></div><div class="stat-value">' + ozet.bos_hisse + '</div><div class="stat-label">Bos Hisse</div></div>';
  html += '<div class="stat-card red"><div class="stat-icon"><i class="fa-solid fa-scissors"></i></div><div class="stat-value">' + ozet.kesildi + '</div><div class="stat-label">Kesildi</div></div>';
  html += '<div class="stat-card green"><div class="stat-icon"><i class="fa-solid fa-money-bill"></i></div><div class="stat-value" style="font-size:18px">' + para(ozet.toplam_gelir) + '</div><div class="stat-label">Tahmini Gelir</div></div>';
  html += '<div class="stat-card green"><div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div><div class="stat-value">' + ozet.odendi + '</div><div class="stat-label">Odeme Tamam</div></div>';
  html += '<div class="stat-card yellow"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div><div class="stat-value">' + ozet.bekliyor + '</div><div class="stat-label">Odeme Bekliyor</div></div>';
  html += '</div>';

  // Kurban tablosu
  html += '<div class="card" style="margin-bottom:16px">';
  html += '<div class="card-title"><i class="fa-solid fa-cow"></i> Kurban Listesi';
  html += '<button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="yazdir(\'kurbanlar\')"><i class="fa-solid fa-print"></i> Yazdir</button></div>';
  html += '<div class="table-wrap"><table><thead><tr>';
  html += '<th>No</th><th>Tur</th><th>Kupe No</th><th>Alis Fiyati</th><th>Hisse</th><th>Durum</th><th>Kesim</th><th>Islem</th>';
  html += '</tr></thead><tbody>';
  kurbanlar.forEach(k => {
    const dolu = k.dolu_hisse, top = k.toplam_hisse;
    const pct = Math.round(dolu/top*100);
    const durum = k.kesildi ? '<span class="badge badge-red">Kesildi</span>' : dolu>=top ? '<span class="badge badge-yellow">Doldu</span>' : '<span class="badge badge-green">Bos</span>';
    html += '<tr>';
    html += '<td><span class="kurban-no-badge">' + k.kurban_no + '</span></td>';
    html += '<td>' + (k.tur==='buyukbas'?'<span class="badge badge-blue">Buyukbas</span>':'<span class="badge badge-gray">Kucukbas</span>') + '</td>';
    html += '<td><span class="badge badge-purple" style="font-size:10px">' + (k.kurban_turu||'Udhiye') + '</span></td>';
    html += '<td>' + (k.kupe_no||'-') + '</td>';
    html += '<td>' + (k.alis_fiyati?para(k.alis_fiyati):'-') + '</td>';
    html += '<td><div style="display:flex;align-items:center;gap:6px;min-width:100px"><div class="progress-bar" style="flex:1"><div class="progress-fill ' + (dolu>=top?'full':'') + '" style="width:' + pct + '%"></div></div><span style="font-size:12px">' + dolu + '/' + top + '</span></div></td>';
    html += '<td>' + durum + '</td>';
    html += '<td>' + (k.kesim_tarihi||'-') + '</td>';
    html += '<td><div style="display:flex;gap:4px">';
    html += '<button class="btn btn-purple btn-sm" onclick="yazdirKurban(' + k.id + ',' + k.kurban_no + ',\'' + k.tur + '\')"><i class="fa-solid fa-print"></i> Yazdır</button>';
    html += '<button class="btn btn-success btn-sm" onclick="excelIndirKurban(' + k.id + ')"><i class="fa-solid fa-file-excel"></i> Excel</button>';
    html += '</div></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';

  // Bağışçı tablosu
  html += '<div class="card">';
  html += '<div class="card-title"><i class="fa-solid fa-users"></i> Bagisci Listesi';
  html += '<button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="yazdir(\'bagiscilar\')"><i class="fa-solid fa-print"></i> Yazdir</button></div>';
  html += '<div class="table-wrap"><table><thead><tr>';
  html += '<th>#</th><th>Kurban No</th><th>Hisse</th><th>Tur</th><th>Bagisci Adi</th><th>Telefon</th><th>Kimin Adina</th><th>Odeme</th><th>Video</th>';
  html += '</tr></thead><tbody>';
  const oRenk = {odendi:'badge-green',iptal:'badge-red',bekliyor:'badge-gray'};
  const oLabel = {odendi:'Odendi',iptal:'Iptal',bekliyor:'Bekliyor'};
  hisseler.forEach((h,i) => {
    html += '<tr>';
    html += '<td style="color:var(--text3);font-size:12px">' + (i+1) + '</td>';
    html += '<td><span class="kurban-no-badge">' + h.kurban_no + '</span></td>';
    html += '<td><span class="badge badge-blue">' + h.hisse_no + '</span></td>';
    html += '<td>' + (h.tur==='buyukbas'?'<span class="badge badge-blue">Buyukbas</span>':'<span class="badge badge-gray">Kucukbas</span>') + '</td>';
    html += '<td><strong>' + esc(h.bagisci_adi) + '</strong></td>';
    html += '<td>' + (h.bagisci_telefon||'-') + '</td>';
    html += '<td>' + (h.kimin_adina?'<span style="color:var(--purple)">'+esc(h.kimin_adina)+'</span>':'-') + '</td>';
    html += '<td><span class="badge ' + (oRenk[h.odeme_durumu]||'badge-gray') + '">' + (oLabel[h.odeme_durumu]||h.odeme_durumu) + '</span></td>';
    html += '<td>' + (h.video_ister?'<span class="badge badge-purple"><i class="fa-solid fa-video"></i> Evet</span>':'-') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';

  document.getElementById('rapor-icerik').innerHTML = html;
}

function excelIndir() {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  downloadExcel('/api/organizasyonlar/' + S.orgId + '/excel', 'icder-kurban-rapor.xlsx');
}

// ─── YAZDIR FONKSİYONLARI ────────────────────────────────────────────────────

function yazdir(tip) {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  const html = yazdirilabilirHTML(tip);
  const blob = new Blob([html], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  iframe.src = url;
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
  };
}

async function yazdirKurban(kurbanId, kurbanNo, tur) {
  // Direkt yatay yazdır (varsayılan)
  toast('Yazdırma hazırlanıyor...');
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  const kurbanData = _kurbanlar.find(k => k.id === kurbanId) || {};
  const html = kurbanYazdirHTML(kurbanNo, tur, hisseler, kurbanData, 'landscape');
  printHTML(html);
}

// ─── YAZDIR SEÇİM MODALI ────────────────────────────────────────────────────
function modalYazdirSecim(kurbanId, kurbanNo, tur) {
  openModal('Yazdırma Yönü Seçin', `
    <div style="text-align:center;padding:20px 0">
      <p style="color:var(--text2);margin-bottom:30px;font-size:15px">Kurban ${kurbanNo} için yazdırma yönünü seçin:</p>
      <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="yazdirKurbanSatir(${kurbanId});closeModal()" style="min-width:160px;padding:16px 24px;font-size:16px">
          <i class="fa-solid fa-print"></i> Yatay Yazdır
        </button>
        <button class="btn btn-green" onclick="yazdirKurbanDikey(${kurbanId}, ${kurbanNo}, '${tur}');closeModal()" style="min-width:160px;padding:16px 24px;font-size:16px">
          <i class="fa-solid fa-print"></i> Dikey Yazdır
        </button>
      </div>
    </div>
  `, false, 'print');
}

async function yazdirKurbanDikey(kurbanId, kurbanNo, tur) {
  toast('Yazdırma hazırlanıyor...');
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  const kurbanData = _kurbanlar.find(k => k.id === kurbanId) || {};
  const html = kurbanYazdirHTML(kurbanNo, tur, hisseler, kurbanData, 'portrait');
  printHTML(html);
}

async function excelIndirKurban(kurbanId) {
  await downloadExcel('/kurbanlar/' + kurbanId + '/excel', 'kurban-' + kurbanId + '.xlsx');
}

function yazdirilabilirHTML(tip) {
  const icerik = document.getElementById('rapor-icerik');
  const baslik = tip === 'kurbanlar' ? 'Kurban Listesi' : tip === 'bagiscilar' ? 'Bagisci Listesi' : 'Tam Rapor';
  const baseUrl = window.location.origin;
  const printStyle = 'body{font-family:Arial,sans-serif;font-size:12px;color:#000;margin:20px}' +
    '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid #1a2a50;padding-bottom:10px}' +
    '.header-left{font-size:18px;font-weight:bold;color:#1a2a50}' +
    '.header-left small{display:block;font-size:11px;color:#666;font-weight:normal}' +
    'h2{font-size:14px;color:#333;margin:16px 0 8px}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:20px}' +
    'th{background:#1a2a50;color:#fff;padding:8px;text-align:left;font-size:11px}' +
    'td{padding:7px 8px;border-bottom:1px solid #ddd;font-size:11px}' +
    'tr:nth-child(even){background:#f5f5f5}' +
    '.stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px}' +
    '.stat{background:#f0f4ff;border:1px solid #c0d0ff;border-radius:6px;padding:10px 16px;min-width:100px}' +
    '.stat .v{font-size:22px;font-weight:bold;color:#1a2a50}.stat .l{font-size:10px;color:#666;text-transform:uppercase}' +
    '.footer{margin-top:30px;font-size:12px;color:#333;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ddd;padding-top:10px}' +
    '.footer-left{font-weight:bold;font-size:14px}' +
    '.footer-right{font-size:11px;color:#666}' +
    '@media print{body{margin:10px}}';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baslik + '</title>' +
    '<style>' + printStyle + '</style></head><body>' +
    '<div class="header">' +
    '<div style="display:flex;align-items:center;gap:10px">' +
    '<img src="' + baseUrl + '/icder.png" style="height:48px;object-fit:contain" onerror="this.style.display=\'none\'" />' +
    '<div class="header-left"><strong>İÇDER</strong><small>' + baslik + ' &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
    '<img src="' + baseUrl + '/cad.png" style="height:48px;object-fit:contain" onerror="this.style.display=\'none\'" />' +
    '<div style="font-size:12px;color:#555;text-align:right">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +
    '</div>' +
    '</div>' +
    (icerik ? icerik.innerHTML : '') +
    '<div class="footer">' +
    '<div class="footer-left">İÇDER</div>' +
    '</div>' +
    '</body></html>';
}


function kurbanYazdirHTML(kurbanNo, tur, hisseler, kurbanData, orientation = 'portrait') {
  const kurbanTuru = (kurbanData && kurbanData.kurban_turu) || 'Udhiye';

  const minSatir = tur === 'buyukbas' ? 7 : 1;
  let rows = '';
  for (let i = 0; i < minSatir; i++) {
    const h = hisseler[i];
    rows += '<tr style="height:42px">';
    rows += '<td style="text-align:center;font-weight:bold;border:1.5px solid #000;padding:8px 6px;font-size:16px;width:60px">' + (i + 1) + '</td>';
    rows += '<td style="border:1.5px solid #000;padding:8px 14px;font-size:16px">' + (h && h.bagisci_adi ? h.bagisci_adi : '') + '</td>';
    rows += '<td style="border:1.5px solid #000;padding:8px 14px;font-size:16px;width:140px;text-align:center">' + kurbanTuru + '</td>';
    rows += '</tr>';
  }

  const baseUrl = window.location.origin;
  const logoSrc = _kullaniciAyarlar.logo_data || (baseUrl + '/icder.png');
  const bayrakSrc = _kullaniciAyarlar.bayrak_data || '';

  // Yatay modda daha büyük logolar
  const logoHeight = orientation === 'landscape' ? '200px' : '180px';
  const logoMaxWidth = orientation === 'landscape' ? '500px' : '400px';
  const bayrakHeight = orientation === 'landscape' ? '120px' : '100px';
  const bayrakWidth = orientation === 'landscape' ? '180px' : '150px';
  const turkBayrakWidth = orientation === 'landscape' ? '180' : '150';
  const turkBayrakHeight = orientation === 'landscape' ? '120' : '100';

  const printStyle = `
    @page { margin: 15mm; size: A4 ${orientation}; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1a2a50; }
    .header-left { width: ${bayrakWidth}; display: flex; align-items: center; }
    .header-center { flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; padding: 0 10px; }
    .header-center img { height: ${logoHeight}; max-width: ${logoMaxWidth}; object-fit: contain; }
    .header-right { width: ${bayrakWidth}; display: flex; align-items: center; justify-content: flex-end; }
    .header-right img { height: ${bayrakHeight}; width: ${bayrakWidth}; object-fit: contain; }
    .kurban-title { font-size: 36px; font-weight: bold; color: #1a2a50; text-align: center; margin: 20px 0 30px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { border: 1.5px solid #000; padding: 10px 14px; text-align: left; font-size: 16px; font-weight: bold; background: #fff; }
    td { border: 1.5px solid #000; padding: 8px 14px; font-size: 16px; }
    .footer { position: fixed; bottom: 8mm; left: 0; right: 0; text-align: center; font-size: 14px; font-weight: bold; color: #333; border-top: 1px solid #ddd; padding-top: 6px; }
    @media print {
      html, body { margin: 0; padding: 0; }
    }
  `;

  // Türk bayrağı SVG - boyut dinamik
  const turkBayrakSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="${turkBayrakWidth}" height="${turkBayrakHeight}">
    <rect width="1200" height="800" fill="#E30A17"/>
    <circle cx="425" cy="400" r="200" fill="white"/>
    <circle cx="475" cy="400" r="160" fill="#E30A17"/>
    <polygon points="583.334,400 764.235,458.779 652.431,304.894 652.431,495.106 764.235,341.221" fill="white"/>
  </svg>`;

  const bayrakImg = bayrakSrc
    ? '<img src="' + bayrakSrc + '" alt="Bayrak" style="height:' + bayrakHeight + ';width:' + bayrakWidth + ';object-fit:contain" onerror="this.style.visibility=\'hidden\'"/>'
    : '';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kurban : ' + kurbanNo + '</title>' +
    '<style>' + printStyle + '</style></head><body>' +
    '<div class="header">' +
    '<div class="header-left">' + turkBayrakSVG + '</div>' +
    '<div class="header-center">' +
    '<img src="' + logoSrc + '" alt="Logo" onerror="this.style.visibility=\'hidden\'"/>' +
    '</div>' +
    '<div class="header-right">' + bayrakImg + '</div>' +
    '</div>' +
    '<div class="kurban-title">Kurban : ' + kurbanNo + '</div>' +
    '<table>' +
    '<thead><tr>' +
    '<th style="width:60px;text-align:center">No</th>' +
    '<th>İsim Soyisim</th>' +
    '<th style="width:140px;text-align:center">Kurban Türü</th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>' +
    '<div class="footer">İÇDER</div>' +
    '</body></html>';
}

// ═══════════════════════════════════════════════════════════════════════════
// DENETİM MASASI
// ═══════════════════════════════════════════════════════════════════════════
async function renderDenetim() {
  // IP adresini sunucudan al
  let ipAdresleri = [];
  try {
    const r = await api('GET', '/sistem/ip');
    ipAdresleri = r.ips || [];
  } catch(e) {}

  const ipRows = ipAdresleri.length
    ? ipAdresleri.map(item => {
        const url = 'http://' + item.ip + ':4500';
        return '<tr><td style="color:var(--text3);padding:7px 0;width:130px">' + esc(item.ad||'WiFi') + '</td>' +
          '<td><span style="color:var(--green);font-weight:700;font-size:14px">' + url + '</span>' +
          ' <button class="btn btn-secondary btn-sm" style="margin-left:8px" onclick="navigator.clipboard.writeText(\'' + url + '\').then(()=>toast(\'Kopyalandi\'))"><i class="fa-solid fa-copy"></i></button>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:3px">Ayni WiFi\'deki cihazlar bu adresten girebilir</div></td></tr>';
      }).join('')
    : '<tr><td colspan="2" style="color:var(--text3);padding:7px 0">IP adresi bulunamadi. WiFi baglantinizi kontrol edin.</td></tr>';

  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-shield-halved"></i></div>
        Denetim Masasi
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      <div class="card" style="grid-column:1/-1;border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.05)">
        <div class="card-title"><i class="fa-solid fa-wifi"></i> Ag Erisimi — WiFi'deki Cihazlar</div>
        <table style="font-size:13px;width:100%">
          ${ipRows}
          <tr><td style="color:var(--text3);padding:7px 0;width:130px">Kullanim</td><td style="font-size:12px;color:var(--text2)">Ayni WiFi'deki telefon veya bilgisayardan tarayicida yukardaki adresi ac</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-circle-info"></i> Uygulama Bilgileri</div>
        <table style="font-size:13px;width:100%">
          <tr><td style="color:var(--text3);padding:7px 0;width:130px">Uygulama</td><td style="font-weight:600">İÇDER Kurban Programı</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Versiyon</td><td>1.0.0</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">İşbirliği</td><td style="color:var(--accent);font-weight:600">İÇDER & Defterdar</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Modul</td><td>Kurban Organizasyonu</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Lisans</td><td>İÇDER &copy; 2025</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-database"></i> Veritabani</div>
        <table style="font-size:13px;width:100%">
          <tr><td style="color:var(--text3);padding:7px 0;width:130px">Motor</td><td>SQLite (sql.js)</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Konum</td><td>userData/data/icder-kurban.db</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Durum</td><td><span class="badge badge-green"><i class="fa-solid fa-circle"></i> Aktif</span></td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-gear"></i> Sistem</div>
        <table style="font-size:13px;width:100%">
          <tr><td style="color:var(--text3);padding:7px 0;width:130px">Platform</td><td>Electron + Node.js</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Sunucu</td><td>Express.js :4500</td></tr>
          <tr><td style="color:var(--text3);padding:7px 0">Kurulum</td><td>NSIS + MSI</td></tr>
        </table>
      </div>
    </div>`;
}


// ═══════════════════════════════════════════════════════════════════════════
// ÇÖP KUTUSU
// ═══════════════════════════════════════════════════════════════════════════
async function renderCopKutusu() {
  const m = document.getElementById('main-content');
  m.innerHTML =
    '<div class="page-header">' +
      '<div class="page-title"><div class="icon-wrap"><i class="fa-solid fa-trash-can"></i></div>Cop Kutusu</div>' +
      '<button class="btn btn-danger" onclick="copBosalt()"><i class="fa-solid fa-trash"></i> Tamamini Sil</button>' +
    '</div>' +
    '<div class="card" id="cop-icerik"><div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yukleniyor...</p></div></div>';
  await yuklecopKutusu();
}

async function yuklecopKutusu() {
  const list = await api('GET', '/cop-kutusu');
  const el = document.getElementById('cop-icerik');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-trash-can" style="opacity:.3"></i><p>Cop kutusu bos.</p></div>';
    return;
  }
  const turIcon = { organizasyon: 'fa-layer-group', kurban: 'fa-cow' };
  const turRenk = { organizasyon: 'badge-blue', kurban: 'badge-yellow' };
  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
  html += '<span style="font-size:13px;color:var(--text2)">' + list.length + ' ogre silindi</span>';
  html += '<button class="btn btn-success btn-sm" onclick="copTumunuGeriYukle()"><i class="fa-solid fa-rotate-left"></i> Tamamini Geri Yukle</button>';
  html += '</div>';
  html += '<div class="table-wrap"><table><thead><tr><th>Tur</th><th>Icerik</th><th>Silinme Tarihi</th><th>Islem</th></tr></thead><tbody>';
  list.forEach(item => {
    const tarih = new Date(item.silme_tarihi).toLocaleString('tr-TR');
    html += '<tr>';
    html += '<td><span class="badge ' + (turRenk[item.tur]||'badge-gray') + '"><i class="fa-solid ' + (turIcon[item.tur]||'fa-file') + '"></i> ' + item.tur + '</span></td>';
    html += '<td><strong>' + esc(item.baslik) + '</strong></td>';
    html += '<td style="font-size:12px;color:var(--text3)">' + tarih + '</td>';
    html += '<td><div style="display:flex;gap:6px">';
    html += '<button class="btn btn-success btn-sm" onclick="copGeriYukle(' + item.id + ')"><i class="fa-solid fa-rotate-left"></i> Geri Yukle</button>';
    html += '<button class="btn btn-danger btn-sm btn-icon" onclick="copSil(' + item.id + ')"><i class="fa-solid fa-trash"></i></button>';
    html += '</div></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

async function copGeriYukle(id) {
  try {
    await api('POST', '/cop-kutusu/' + id + '/geri-yukle');
    toast('Geri yuklendi');
    await yuklecopKutusu();
  } catch(e) { toast(e.message, 'error'); }
}

async function copTumunuGeriYukle() {
  const list = await api('GET', '/cop-kutusu');
  if (!list.length) return toast('Cop kutusu bos');
  if (!confirm(list.length + ' oge geri yuklenecek. Emin misiniz?')) return;
  for (const item of list) {
    try { await api('POST', '/cop-kutusu/' + item.id + '/geri-yukle'); } catch(e) {}
  }
  toast('Tumu geri yuklendi');
  await yuklecopKutusu();
}

async function copSil(id) {
  if (!confirm('Bu oge kalici olarak silinecek. Emin misiniz?')) return;
  try {
    await api('DELETE', '/cop-kutusu/' + id);
    toast('Kalici olarak silindi');
    await yuklecopKutusu();
  } catch(e) { toast(e.message, 'error'); }
}

async function copBosalt() {
  if (!confirm('Cop kutusu tamamen bosaltilacak. Geri alinamaz. Emin misiniz?')) return;
  try {
    await api('DELETE', '/cop-kutusu');
    toast('Cop kutusu bosaltildi');
    await yuklecopKutusu();
  } catch(e) { toast(e.message, 'error'); }
}

// ─── YAZDIR / EXCEL YARDIMCI ─────────────────────────────────────────────────
async function printHTML(html) {
  if (window.electronAPI && window.electronAPI.printHTML) {
    await window.electronAPI.printHTML(html);
  } else {
    // Web fallback: iframe ile
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      try { iframe.contentWindow.print(); } catch(e) {}
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, 300);
  }
}

async function downloadExcel(url, filename) {
  try {
    toast('Excel hazirlaniyor...');
    if (window.electronAPI && window.electronAPI.downloadFile) {
      // Electron: native save dialog
      const fullUrl = url.startsWith('http') ? url : 'http://127.0.0.1:4500' + url;
    const result = await window.electronAPI.downloadFile(fullUrl, filename);
      if (result && result.ok) toast('Excel kaydedildi: ' + result.path);
      else if (result && !result.ok && !result.error) toast('Iptal edildi');
      else toast('Hata: ' + (result && result.error || 'Bilinmeyen'), 'error');
    } else {
      // Tarayıcı fallback
      const r = await fetch(url);
      if (!r.ok) throw new Error('Sunucu hatasi');
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 1000);
      toast('Excel indirildi');
    }
  } catch(e) { toast('Excel indirilemedi: ' + e.message, 'error'); }
}

// ─── DROPDOWN MENU TOGGLE ─────────────────────────────────────────────────────
function togglePrintMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('print-menu');
  const isVisible = menu.style.display !== 'none';
  
  // Close all menus first
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  
  if (!isVisible) {
    menu.style.display = 'block';
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      });
    }, 0);
  }
}

function toggleBagisciPrintMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('bagisci-print-menu');
  const isVisible = menu.style.display !== 'none';
  
  // Close all menus first
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  
  if (!isVisible) {
    menu.style.display = 'block';
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      });
    }, 0);
  }
}

function toggleRaporPrintMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('rapor-print-menu');
  const isVisible = menu.style.display !== 'none';
  
  // Close all menus first
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  
  if (!isVisible) {
    menu.style.display = 'block';
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      });
    }, 0);
  }
}

function toggleRowPrintMenu(event, kurbanId) {
  event.stopPropagation();
  const menu = document.getElementById('row-print-menu-' + kurbanId);
  const isVisible = menu.style.display !== 'none';
  
  // Close all menus first
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  
  if (!isVisible) {
    menu.style.display = 'block';
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      });
    }, 0);
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  showPage('organizasyonlar');

  // Kapatma öncesi yedek
  if (window.electronAPI && window.electronAPI.onBeforeClose) {
    window.electronAPI.onBeforeClose(() => {
      modalKapatmaYedek();
    });
  }
});

async function modalKapatmaYedek() {
  // Overlay oluştur
  const overlay = document.createElement('div');
  overlay.id = 'close-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)';

  const box = document.createElement('div');
  box.style.cssText = 'background:linear-gradient(135deg,#0d1220,#111827);border:1px solid #2a3347;border-radius:16px;padding:32px;max-width:460px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.6)';

  const orgList = S.orgId ? [{ id: S.orgId, ad: S.orgAd }] : [];
  let orgOpts = '<option value="">-- Organizasyon secin --</option>';
  try {
    const orgs = await api('GET', '/organizasyonlar');
    orgOpts = orgs.map(o => '<option value="' + o.id + '"' + (o.id === S.orgId ? ' selected' : '') + '>' + esc(o.ad) + ' (' + o.yil + ')</option>').join('');
  } catch(e) {}

  box.innerHTML =
    '<div style="font-size:40px;margin-bottom:12px">&#128190;</div>' +
    '<div style="font-size:18px;font-weight:800;color:#e2e8f0;margin-bottom:8px">Kapatmadan Once Yedek Al</div>' +
    '<div style="font-size:13px;color:#94a3b8;margin-bottom:20px;line-height:1.6">Uygulama kapatilmadan once verilerinizi yedeklemek ister misiniz?<br>Yedek Excel formatinda kaydedilecektir.</div>' +
    '<div style="margin-bottom:16px">' +
    '<select id="close-org-select" style="width:100%;background:#1a2235;border:1px solid #2a3347;border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;outline:none">' +
    orgOpts + '</select></div>' +
    '<div style="display:flex;gap:10px;justify-content:center">' +
    '<button id="btn-yedek-al" style="background:linear-gradient(135deg,#4f7ef8,#3d6ef0);color:#fff;border:none;border-radius:10px;padding:11px 24px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-floppy-disk"></i> Yedekle ve Kapat</button>' +
    '<button id="btn-yedeksiz-kapat" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:11px 24px;font-size:14px;font-weight:600;cursor:pointer">Yedeksiz Kapat</button>' +
    '<button id="btn-iptal" style="background:#1a2235;color:#94a3b8;border:1px solid #2a3347;border-radius:10px;padding:11px 24px;font-size:14px;cursor:pointer">Iptal</button>' +
    '</div>' +
    '<div id="close-status" style="margin-top:12px;font-size:12px;color:#94a3b8;min-height:18px"></div>';

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById('btn-iptal').onclick = () => {
    document.body.removeChild(overlay);
  };

  document.getElementById('btn-yedeksiz-kapat').onclick = async () => {
    if (confirm('Yedek almadan kapatmak istediginizden emin misiniz?')) {
      await window.electronAPI.forceQuit();
    }
  };

  document.getElementById('btn-yedek-al').onclick = async () => {
    const orgId = document.getElementById('close-org-select').value;
    if (!orgId) {
      document.getElementById('close-status').textContent = 'Lutfen bir organizasyon secin.';
      document.getElementById('close-status').style.color = '#ef4444';
      return;
    }
    const statusEl = document.getElementById('close-status');
    statusEl.textContent = 'Yedek hazirlaniyor...';
    statusEl.style.color = '#4f7ef8';
    document.getElementById('btn-yedek-al').disabled = true;

    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = 'icder-kurban-yedek-' + tarih + '.xlsx';
    const excelUrl = 'http://127.0.0.1:4500/api/organizasyonlar/' + orgId + '/excel';

    const result = await window.electronAPI.backupAndQuit(excelUrl);
    if (result && result.ok) {
      statusEl.textContent = 'Yedek kaydedildi: ' + result.path;
      statusEl.style.color = '#10b981';
      setTimeout(async () => { await window.electronAPI.forceQuit(); }, 1200);
    } else if (result && result.canceled) {
      statusEl.textContent = 'Kaydetme iptal edildi. Tekrar deneyin.';
      statusEl.style.color = '#f59e0b';
      document.getElementById('btn-yedek-al').disabled = false;
    } else {
      statusEl.textContent = 'Hata: ' + (result && result.error || 'Bilinmeyen hata');
      statusEl.style.color = '#ef4444';
      document.getElementById('btn-yedek-al').disabled = false;
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BAĞIŞÇI YAZDIR / EXCEL
// ═══════════════════════════════════════════════════════════════════════════

function yazdirBagiscilar() {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  const tbody = document.getElementById('bagisci-tbody');
  if (!tbody) return toast('Bagisci listesi yuklu degil', 'error');

  const rows = Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const cells = tr.querySelectorAll('td');
    if (!cells.length) return '';
    let r = '<tr>';
    cells.forEach((td, i) => {
      if (i < cells.length - 1) r += '<td>' + td.innerText.trim() + '</td>';
    });
    r += '</tr>';
    return r;
  }).join('');

  const baseUrl = window.location.origin;
  const logoSrc = _kullaniciAyarlar.logo_data || (baseUrl + '/yazi.png');

  const printStyle = `
    @page { margin: 12mm 15mm; size: A4; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 12px; }
    .header img { height: 70px; object-fit: contain; }
    .header-info { flex: 1; }
    .header-info .title { font-size: 20px; font-weight: bold; }
    .header-info .sub { font-size: 13px; color: #555; margin-top: 3px; }
    .header-right { text-align: right; font-size: 13px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a2a50; color: #fff; padding: 9px 8px; text-align: left; font-size: 13px; }
    td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
    tr:nth-child(even) { background: #f5f5f5; }
    .footer { margin-top: 20px; font-size: 11px; color: #999; display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 8px; }
    @media print { body { margin: 0; } }
  `;

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bagisci Listesi</title>' +
    '<style>' + printStyle + '</style></head><body>' +
    '<div class="header">' +
    '<img src="' + logoSrc + '" alt="Logo" onerror="this.style.visibility=\'hidden\'"/>' +
    '<div class="header-info">' +
    '<div class="sub">Bağışçı Listesi &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</div>' +
    '</div>' +
    '<div class="header-right">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +
    '</div>' +
    '<table><thead><tr><th>#</th><th>Bağışçı Adı</th><th>Telefon</th><th>Kimin Adına</th><th>Kurban No</th><th>Hisse</th><th>Tür</th><th>Ödeme</th><th>Video</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '<div class="footer"><span>İÇDER</span><span>' + new Date().toLocaleString('tr-TR') + '</span></div>' +
    '</body></html>';

  printHTML(html);
}

async function excelBagiscilarIndir() {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  downloadExcel('/api/organizasyonlar/' + S.orgId + '/excel?sayfa=bagiscilar', 'bagiscilar.xlsx');
}

// ═══════════════════════════════════════════════════════════════════════════
// KURBAN SATIR BUTONLARI — Yazdır + Excel + Tümünü
// ═══════════════════════════════════════════════════════════════════════════

async function yazdirKurbanSatir(kurbanId) {
  const k = _kurbanlar.find(x => x.id === kurbanId);
  if (!k) return;
  await yazdirKurban(kurbanId, k.kurban_no, k.tur);
}

async function excelIndirKurbanSatir(kurbanId) {
  await excelIndirKurban(kurbanId);
}

async function excelKurbanSatir(kurbanId) {
  downloadExcel('/api/kurbanlar/' + kurbanId + '/excel', 'kurban-' + kurbanId + '.xlsx');
}

async function tumKurbanlariYazdir() {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  if (!_kurbanlar.length) return toast('Kurban bulunamadi', 'error');
  toast('Hazirlanıyor...');
  let allHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11px;margin:10px}@media print{.pb{page-break-after:always}}</style></head><body>';
  for (const k of _kurbanlar) {
    const hisseler = await api('GET', '/kurbanlar/' + k.id + '/hisseler');
    const oLabel = {odendi:'Odendi',iptal:'Iptal',bekliyor:'Bekliyor'};
    let rows = hisseler.map(h => '<tr><td>' + h.hisse_no + '</td><td>' + (h.bagisci_adi||'-') + '</td><td>' + (h.bagisci_telefon||'-') + '</td><td>' + (h.kimin_adina||'-') + '</td><td>' + (oLabel[h.odeme_durumu]||'-') + '</td><td>' + (h.video_ister?'Evet':'Hayir') + '</td></tr>').join('');
    allHtml += '<div style="margin-bottom:20px">';
    allHtml += '<div style="display:flex;justify-content:space-between;border-bottom:2px solid #1a2a50;padding-bottom:6px;margin-bottom:10px">';
    allHtml += '<strong style="font-size:14px;color:#1a2a50">İÇDER &mdash; Kurban #' + k.kurban_no + '</strong>';
    allHtml += '<span style="font-size:11px;color:#555">' + esc(S.orgAd) + ' | ' + S.orgYil + '</span></div>';
    allHtml += '<table style="width:100%;border-collapse:collapse;margin-bottom:8px"><tr style="background:#1a2a50;color:#fff"><th style="padding:5px">Hisse</th><th>Bagisci</th><th>Telefon</th><th>Kimin Adina</th><th>Odeme</th><th>Video</th></tr>' + rows + '</table>';
    allHtml += '<div style="font-size:10px;color:#999;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:4px"><span>İÇDER</span><span></span></div>';
    allHtml += '</div><div class="pb"></div>';
  }
  allHtml += '</body></html>';
  printHTML(allHtml);
}

async function tumKurbanlariExcel() {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  downloadExcel('/api/organizasyonlar/' + S.orgId + '/excel', 'icder-kurban-rapor.xlsx');
}


// ═══════════════════════════════════════════════════════════════════════════
// YEDEK GERİ YÜKLEME
// ═══════════════════════════════════════════════════════════════════════════
async function renderYedekGeriYukle() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-database"></i></div>
        Yedek Geri Yükle
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div class="card" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.05)">
        <div class="card-title"><i class="fa-solid fa-download"></i> Tam Yedek Al</div>
        <div style="margin-bottom:16px;font-size:13px;color:var(--text2);line-height:1.7">
          Tüm organizasyonlarınızı, kurbanları, hisseleri ve ayarlarınızı tek bir JSON dosyasına yedekleyin.
          Bu dosyayı güvenli bir yerde saklayın.
        </div>
        <button class="btn btn-success" onclick="tamYedekAl()">
          <i class="fa-solid fa-download"></i> Tam Yedek İndir (JSON)
        </button>
      </div>

      <div class="card" style="border-color:rgba(79,126,248,0.3);background:rgba(79,126,248,0.05)">
        <div class="card-title"><i class="fa-solid fa-upload"></i> Yedek Geri Yükle</div>
        <div style="margin-bottom:16px;font-size:13px;color:var(--text2);line-height:1.7">
          Daha önce aldığınız JSON yedek dosyasını yükleyerek tüm verilerinizi geri yükleyin.
          Mevcut veriler korunur, yeni veriler eklenir veya güncellenir.
        </div>
        <input type="file" id="yedek-dosya-input" accept=".json" style="display:none" onchange="yedekDosyaSecildi(this)"/>
        <button class="btn btn-primary" onclick="document.getElementById('yedek-dosya-input').click()">
          <i class="fa-solid fa-upload"></i> Yedek Dosyası Seç (JSON)
        </button>
      </div>
    </div>

    <div class="card" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.05)">
      <div class="card-title"><i class="fa-solid fa-file-excel"></i> Excel Yedekten Ayarları Geri Yükle</div>
      <div style="margin-bottom:16px;font-size:13px;color:var(--text2);line-height:1.7">
        Excel yedek dosyanızdan yazdırma ayarlarınızı (logo ve bayrak) geri yükleyin.
        Bu özellik sadece yazdırma ayarlarını geri yükler, organizasyon verilerini değil.
      </div>
      <input type="file" id="excel-yedek-input" accept=".xlsx" style="display:none" onchange="excelYedekSecildi(this)"/>
      <button class="btn btn-purple" onclick="document.getElementById('excel-yedek-input').click()">
        <i class="fa-solid fa-file-excel"></i> Excel Yedek Seç (.xlsx)
      </button>
    </div>

    <div class="card">
      <div class="card-title"><i class="fa-solid fa-circle-info"></i> Yedekleme Hakkında</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.8">
        <p><strong style="color:var(--text)">Tam Yedek Sistemi:</strong></p>
        <ul style="margin:8px 0;padding-left:20px">
          <li>Tüm organizasyonlarınız, kurbanlar, hisseler ve bağışçı bilgileri tek dosyada</li>
          <li>Kullanıcı ayarlarınız (logo, bayrak) dahil</li>
          <li>JSON formatında, okunabilir ve taşınabilir</li>
          <li>Geri yükleme sırasında mevcut veriler korunur</li>
          <li>Aynı organizasyon varsa güncellenir, yoksa yeni eklenir</li>
        </ul>
        <p style="margin-top:12px"><strong style="color:var(--text)">Excel Yedek Sistemi:</strong></p>
        <ul style="margin:8px 0;padding-left:20px">
          <li>Organizasyon Excel yedeklerinde yazdırma ayarları (logo ve bayrak) da saklanır</li>
          <li>Excel yedekten sadece yazdırma ayarlarını geri yükleyebilirsiniz</li>
          <li>Mevcut ayarlarınız varsa üzerine yazılmaz, sadece boş olanlar doldurulur</li>
        </ul>
        <p style="margin-top:12px"><strong style="color:var(--text)">Öneriler:</strong></p>
        <ul style="margin:8px 0;padding-left:20px">
          <li>Düzenli olarak yedek alın (haftada bir önerilir)</li>
          <li>Yedek dosyalarını güvenli bir yerde saklayın (USB, bulut depolama)</li>
          <li>Önemli değişikliklerden önce mutlaka yedek alın</li>
          <li>Yedek dosyasını başka bir bilgisayara taşıyabilirsiniz</li>
        </ul>
      </div>
    </div>`;
}

async function tamYedekAl() {
  try {
    toast('Yedek hazırlanıyor...');
    const r = await fetch('/api/tam-yedek');
    if (!r.ok) throw new Error('Yedek alınamadı');
    
    const blob = await r.blob();
    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `icder-kurban-yedek-${tarih}.json`;
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 1000);
    
    toast('Yedek başarıyla indirildi');
  } catch(e) {
    toast('Yedek alınamadı: ' + e.message, 'error');
  }
}

async function yedekDosyaSecildi(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.json')) {
    toast('Lütfen geçerli bir JSON yedek dosyası seçin', 'error');
    input.value = '';
    return;
  }
  
  if (!confirm(`"${file.name}" dosyası yüklenecek. Mevcut verileriniz korunacak, yeni veriler eklenecek veya güncellenecek. Devam etmek istiyor musunuz?`)) {
    input.value = '';
    return;
  }
  
  try {
    toast('Yedek yükleniyor...');
    
    const formData = new FormData();
    formData.append('dosya', file);
    
    const r = await fetch('/api/yedek-geri-yukle', {
      method: 'POST',
      body: formData
    });
    
    const d = await r.json();
    
    if (!r.ok) {
      throw new Error(d.hata || 'Yedek yüklenemedi');
    }
    
    toast('Yedek başarıyla geri yüklendi!');
    
    // Detaylı bilgi göster
    openModal('Yedek Geri Yüklendi', `
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <div style="font-size:16px;font-weight:600;color:var(--green);margin-bottom:8px">Yedek Başarıyla Geri Yüklendi</div>
        <div style="font-size:13px;color:var(--text2)">${d.mesaj || 'Verileriniz geri yüklendi'}</div>
      </div>
      
      ${d.detay ? `
        <div style="background:var(--bg4);border-radius:8px;padding:14px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-weight:600">İSTATİSTİKLER</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
            <div><span style="color:var(--text3)">Yeni Organizasyon:</span> <strong>${d.detay.organizasyonlar || 0}</strong></div>
            <div><span style="color:var(--text3)">Güncellenen:</span> <strong>${d.detay.guncellendi || 0}</strong></div>
            <div><span style="color:var(--text3)">Yeni Kurban:</span> <strong>${d.detay.kurbanlar || 0}</strong></div>
            <div><span style="color:var(--text3)">Yeni Hisse:</span> <strong>${d.detay.hisseler || 0}</strong></div>
          </div>
        </div>
      ` : ''}
      
      <div class="form-actions">
        <button class="btn btn-primary" onclick="closeModal();showPage('organizasyonlar')">
          <i class="fa-solid fa-check"></i> Tamam
        </button>
      </div>
    `, false, 'check-circle');
    
    input.value = '';
    
  } catch(e) {
    toast('Yedek yüklenemedi: ' + e.message, 'error');
    input.value = '';
  }
}

async function excelYedekSecildi(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.xlsx')) {
    toast('Lütfen geçerli bir Excel dosyası seçin (.xlsx)', 'error');
    input.value = '';
    return;
  }
  
  if (!confirm(`"${file.name}" Excel dosyasından yazdırma ayarları (logo ve bayrak) geri yüklenecek. Devam etmek istiyor musunuz?`)) {
    input.value = '';
    return;
  }
  
  try {
    toast('Excel yedek yükleniyor...');
    
    const formData = new FormData();
    formData.append('dosya', file);
    
    const r = await fetch('/api/excel-geri-yukle', {
      method: 'POST',
      body: formData
    });
    
    const d = await r.json();
    
    if (!r.ok) {
      throw new Error(d.hata || 'Excel yedek yüklenemedi');
    }
    
    toast('Excel yedek başarıyla geri yüklendi!');
    
    // Ayarları yeniden yükle
    await yukleKullaniciAyarlar();
    
    // Detaylı bilgi göster
    openModal('Excel Yedek Geri Yüklendi', `
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <div style="font-size:16px;font-weight:600;color:var(--green);margin-bottom:8px">Excel Yedek Başarıyla Geri Yüklendi</div>
        <div style="font-size:13px;color:var(--text2)">${d.mesaj || 'Yazdırma ayarlarınız geri yüklendi'}</div>
      </div>
      
      ${d.detay && d.detay.ayarlar ? `
        <div style="background:var(--bg4);border-radius:8px;padding:14px;margin-bottom:16px;text-align:center">
          <i class="fa-solid fa-check-circle" style="font-size:32px;color:var(--green);margin-bottom:8px"></i>
          <div style="font-size:13px;color:var(--text2)">Logo ve bayrak görselleri başarıyla geri yüklendi</div>
        </div>
      ` : `
        <div style="background:var(--bg5);border-radius:8px;padding:14px;margin-bottom:16px;text-align:center">
          <i class="fa-solid fa-info-circle" style="font-size:32px;color:var(--text3);margin-bottom:8px"></i>
          <div style="font-size:13px;color:var(--text3)">Excel dosyasında yazdırma ayarları bulunamadı</div>
        </div>
      `}
      
      <div class="form-actions">
        <button class="btn btn-primary" onclick="closeModal();showPage('ayarlar')">
          <i class="fa-solid fa-gear"></i> Ayarlara Git
        </button>
        <button class="btn btn-secondary" onclick="closeModal()">
          <i class="fa-solid fa-check"></i> Tamam
        </button>
      </div>
    `, false, 'file-excel');
    
    input.value = '';
    
  } catch(e) {
    toast('Excel yedek yüklenemedi: ' + e.message, 'error');
    input.value = '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMA TOGGLE
// ═══════════════════════════════════════════════════════════════════════════
// TEMA SİSTEMİ
// ═══════════════════════════════════════════════════════════════════════════
const TEMALAR = [
  { id: 'dark', name: 'Koyu Yeşil', class: '' },
  { id: 'light-green', name: 'Açık Yeşil', class: 'theme-light-green' },
  { id: 'mint', name: 'Nane Yeşili', class: 'theme-mint' },
  { id: 'olive', name: 'Zeytin Yeşili', class: 'theme-olive' },
  { id: 'light', name: 'Beyaz/Mavi', class: 'theme-light' }
];

function toggleTheme() {
  modalTemaSecim();
}

function modalTemaSecim() {
  const mevcutTema = localStorage.getItem('icder-kurban-tema') || 'dark';
  const temaButonlari = TEMALAR.map(t => {
    const secili = t.id === mevcutTema ? 'style="border:2px solid var(--accent);box-shadow:0 0 12px var(--glow)"' : '';
    return `
      <button class="btn btn-secondary" onclick="temaDegistir('${t.id}')" ${secili} style="min-width:140px;padding:14px 20px;font-size:15px">
        <i class="fa-solid fa-palette"></i> ${t.name}
      </button>
    `;
  }).join('');

  openModal('Tema Seçin', `
    <div style="text-align:center;padding:20px 0">
      <p style="color:var(--text2);margin-bottom:24px;font-size:14px">Uygulamanın görünümünü değiştirin:</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        ${temaButonlari}
      </div>
    </div>
  `, false, 'palette');
}

function temaDegistir(temaId) {
  const tema = TEMALAR.find(t => t.id === temaId);
  if (!tema) return;

  // Tüm tema classlarını kaldır
  TEMALAR.forEach(t => {
    if (t.class) document.body.classList.remove(t.class);
  });

  // Yeni temayı uygula
  if (tema.class) {
    document.body.classList.add(tema.class);
  }

  localStorage.setItem('icder-kurban-tema', temaId);
  closeModal();
  toast(`${tema.name} teması uygulandı`);
}

// Sayfa yüklenince kayıtlı temayı uygula
(function initTheme() {
  const saved = localStorage.getItem('icder-kurban-tema') || 'dark';
  const tema = TEMALAR.find(t => t.id === saved);
  if (tema && tema.class) {
    document.body.classList.add(tema.class);
  }
})();

// ═══════════════════════════════════════════════════════════════════════════
// MEDYA DEPOSU (Cloudinary)
// ═══════════════════════════════════════════════════════════════════════════
async function renderMedyaDeposu() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-photo-film"></i></div>
        Medya Deposu
        <small>Cloudinary</small>
      </div>
      <div style="display:flex;gap:8px">
        <select id="medya-folder" onchange="loadMedyaListesi()" style="background:var(--bg4);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none">
          <option value="defterdar">Genel</option>
          <option value="defterdar/videolar">Videolar</option>
          <option value="defterdar/fotograflar">Fotograflar</option>
          <option value="defterdar/belgeler">Belgeler</option>
        </select>
        <button class="btn btn-primary" onclick="modalMedyaYukle()">
          <i class="fa-solid fa-upload"></i> Dosya Yukle
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><i class="fa-solid fa-cloud"></i> Yuklenen Dosyalar</div>
      <div id="medya-grid-wrap">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yukleniyor...</p></div>
      </div>
    </div>`;

  await loadMedyaListesi();
}

async function loadMedyaListesi() {
  const folder = document.getElementById('medya-folder')?.value || 'defterdar';
  const wrap = document.getElementById('medya-grid-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yukleniyor...</p></div>`;
  try {
    const list = await api('GET', `/medya/list?folder=${encodeURIComponent(folder)}`);
    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-photo-film"></i><p>Henuz dosya yok.</p></div>`;
      return;
    }
    wrap.innerHTML = `<div class="medya-grid">${list.map(item => medyaKart(item)).join('')}</div>`;
  } catch(e) {
    wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${e.message}</p></div>`;
  }
}

function medyaKart(item) {
  const isVideo = item.resource_type === 'video';
  const kb = Math.round(item.bytes / 1024);
  const boyut = kb > 1024 ? (kb/1024).toFixed(1) + ' MB' : kb + ' KB';
  const thumb = isVideo
    ? `<div class="medya-video-thumb"><i class="fa-solid fa-circle-play"></i></div>`
    : `<img src="${item.secure_url}" alt="medya" loading="lazy"/>`;
  return `
    <div class="medya-item" onclick="medyaOnizle('${item.secure_url}','${item.resource_type}')">
      ${thumb}
      <div class="medya-info">
        <div class="medya-type">${isVideo ? 'Video' : 'Fotograf'} &bull; ${item.format||''}</div>
        <div class="medya-size">${boyut}</div>
      </div>
      <button class="medya-del" onclick="event.stopPropagation();medyaSil('${item.public_id}','${item.resource_type}')" title="Sil">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`;
}

function medyaOnizle(url, type) {
  const isVideo = type === 'video';
  const content = isVideo
    ? `<video src="${url}" controls style="width:100%;border-radius:8px;max-height:60vh"></video>`
    : `<img src="${url}" style="width:100%;border-radius:8px;max-height:70vh;object-fit:contain"/>`;
  openModal('Onizleme', `
    ${content}
    <div class="form-actions" style="margin-top:12px">
      <a href="${url}" target="_blank" class="btn btn-secondary"><i class="fa-solid fa-external-link"></i> Yeni Sekmede Ac</a>
      <button class="btn btn-secondary" onclick="closeModal()">Kapat</button>
    </div>`, true, 'eye');
}

async function medyaSil(publicId, resourceType) {
  if (!confirm('Bu dosyayi silmek istediginizden emin misiniz?')) return;
  try {
    await api('DELETE', '/medya/delete', { public_id: publicId, resource_type: resourceType });
    toast('Dosya silindi');
    await loadMedyaListesi();
  } catch(e) { toast(e.message, 'error'); }
}

function modalMedyaYukle() {
  const folder = document.getElementById('medya-folder')?.value || 'defterdar';
  openModal('Dosya Yukle', `
    <div class="upload-zone" id="upload-zone" onclick="document.getElementById('medya-file-input').click()"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="handleMedyaDrop(event)">
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <p>Dosyayi buraya surukle veya tikla</p>
      <small>Resim: JPG, PNG, WEBP &bull; Video: MP4, MOV, WEBM (maks. 100MB)</small>
      <div class="upload-progress" id="upload-progress">
        <div class="upload-progress-fill" id="upload-progress-fill" style="width:0%"></div>
      </div>
    </div>
    <input type="file" id="medya-file-input" style="display:none"
      accept="image/*,video/*"
      onchange="yukleSeciliDosya(this.files[0],'${folder}')"/>
    <div id="upload-result" style="margin-top:12px"></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Kapat</button>
    </div>`, false, 'upload');
}

function handleMedyaDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  const folder = document.getElementById('medya-folder')?.value || 'defterdar';
  const file = e.dataTransfer.files[0];
  if (file) yukleSeciliDosya(file, folder);
}

async function yukleSeciliDosya(file, folder) {
  if (!file) return;
  const prog = document.getElementById('upload-progress');
  const fill = document.getElementById('upload-progress-fill');
  const result = document.getElementById('upload-result');
  if (prog) { prog.style.display = 'block'; fill.style.width = '10%'; }

  const formData = new FormData();
  formData.append('dosya', file);
  formData.append('folder', folder);

  try {
    if (fill) fill.style.width = '40%';
    const r = await fetch('/api/medya/upload', { method: 'POST', body: formData });
    if (fill) fill.style.width = '90%';
    const data = await r.json();
    if (!r.ok) throw new Error(data.hata || 'Yuklenemedi');
    if (fill) fill.style.width = '100%';
    if (result) result.innerHTML = `
      <div class="badge badge-green" style="font-size:12px;padding:8px 14px">
        <i class="fa-solid fa-circle-check"></i> Yuklendi: ${file.name}
      </div>`;
    toast('Dosya yuklendi');
    setTimeout(() => { closeModal(); loadMedyaListesi(); }, 800);
  } catch(e) {
    if (result) result.innerHTML = `<div class="badge badge-red" style="font-size:12px;padding:8px 14px"><i class="fa-solid fa-circle-xmark"></i> ${e.message}</div>`;
    toast(e.message, 'error');
  }
}

// Hisse modalına medya yükleme butonu ekle (hisse kaydedilince çağrılabilir)
async function modalHisseMedya(hisseId, kurbanNo, hisseNo) {
  const folder = `defterdar/kurban-${kurbanNo}/hisse-${hisseNo}`;
  openModal(`Kurban #${kurbanNo} Hisse ${hisseNo} — Medya`, `
    <div class="upload-zone" id="upload-zone" onclick="document.getElementById('hisse-file-input').click()"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="handleHisseDrop(event,'${folder}')">
      <i class="fa-solid fa-video"></i>
      <p>Video veya fotograf yukle</p>
      <small>Bu hisseye ait kesim videosu veya fotografini yukleyin</small>
      <div class="upload-progress" id="upload-progress">
        <div class="upload-progress-fill" id="upload-progress-fill" style="width:0%"></div>
      </div>
    </div>
    <input type="file" id="hisse-file-input" style="display:none"
      accept="image/*,video/*"
      onchange="yukleSeciliDosya(this.files[0],'${folder}')"/>
    <div id="upload-result" style="margin-top:12px"></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Kapat</button>
    </div>`, false, 'video');
}

function handleHisseDrop(e, folder) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) yukleSeciliDosya(file, folder);
}


// ═══════════════════════════════════════════════════════════════════════════
// BAĞIŞ YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

function renderBagisTurleri() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-list"></i></div>
        Bağış Türleri
      </div>
      <button class="btn btn-primary" onclick="modalYeniBagisTuru()">
        <i class="fa-solid fa-plus"></i> Yeni Bağış Türü
      </button>
    </div>
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-list"></i>
        <p>Bağış türleri yönetimi geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderBagisRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-chart-line"></i></div>
        Bağış Raporları
      </div>
      <button class="btn btn-primary" onclick="exportBagisRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-chart-line"></i>
        <p>Bağış raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderBagisciYonetimi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-user-tie"></i></div>
        Bağışçı Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniBagisci()">
        <i class="fa-solid fa-plus"></i> Yeni Bağışçı
      </button>
    </div>
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-user-tie"></i>
        <p>Bağışçı yönetimi geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderBagisAl() {
  if (S.orgId) { renderBagisAlKurban(); return; }
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-hand-holding-heart"></i></div>
        Bağış Al
      </div>
    </div>
    <div class="card" style="text-align:center;padding:40px">
      <i class="fa-solid fa-layer-group" style="font-size:48px;color:var(--accent);margin-bottom:16px;display:block"></i>
      <h3 style="margin-bottom:8px">Önce bir organizasyon seçin</h3>
      <p style="color:var(--text3);margin-bottom:20px">Bağış almak için sol menüden bir organizasyon seçin.</p>
      <button class="btn btn-primary" onclick="showPage('organizasyonlar')">
        <i class="fa-solid fa-layer-group"></i> Organizasyonlara Git
      </button>
    </div>`;
}

let _bagisAlMod = null;
let _bagisAlKurban = null;
let _bagisAlHisseler = [];

async function renderBagisAlKurban() {
  const m = document.getElementById('main-content');
  m.innerHTML = '<div class="page-header"><div class="page-title"><div class="icon-wrap"><i class="fa-solid fa-hand-holding-heart"></i></div>Bağış Al <small>' + esc(S.orgAd) + '</small></div></div>' +
    '<div class="card"><div class="card-title"><i class="fa-solid fa-cow"></i> Kurban Seçimi</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
    '<button class="btn btn-primary" style="padding:20px;font-size:15px;flex-direction:column;gap:8px;height:auto" onclick="bagisAlMevcut()">' +
    '<i class="fa-solid fa-list" style="font-size:24px"></i><span>Mevcut Kurbandan Seç</span>' +
    '<span style="font-size:12px;opacity:0.8">Oluşturulmuş kurbanlardan birini seç</span></button>' +
    '<button class="btn btn-success" style="padding:20px;font-size:15px;flex-direction:column;gap:8px;height:auto" onclick="bagisAlYeni()">' +
    '<i class="fa-solid fa-plus-circle" style="font-size:24px"></i><span>Yeni Kurban Oluştur</span>' +
    '<span style="font-size:12px;opacity:0.8">Yeni kurban ekle ve bağışçıları gir</span></button></div>' +
    '<div id="bagis-al-icerik"></div></div>';
}

async function bagisAlMevcut() {
  _bagisAlMod = 'mevcut';
  const icerik = document.getElementById('bagis-al-icerik');
  icerik.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Kurbanlar yükleniyor...</p></div>';
  try {
    const kurbanlar = await api('GET', '/organizasyonlar/' + S.orgId + '/kurbanlar');
    const bos = kurbanlar.filter(k => !k.kesildi && k.dolu_hisse < k.toplam_hisse);
    if (!bos.length) {
      icerik.innerHTML = '<div class="empty-state"><i class="fa-solid fa-cow"></i><p>Boş hisseli kurban bulunamadı.</p>' +
        '<button class="btn btn-success" onclick="bagisAlYeni()" style="margin-top:12px"><i class="fa-solid fa-plus"></i> Yeni Kurban Oluştur</button></div>';
      return;
    }
    let html = '<div style="margin-bottom:12px;font-size:13px;color:var(--text2)"><i class="fa-solid fa-info-circle" style="color:var(--accent)"></i> Bağışçı eklemek istediğiniz kurbanı seçin:</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">';
    bos.forEach(k => {
      html += '<div class="org-card" onclick="bagisAlKurbanSec(' + k.id + ')" style="cursor:pointer">' +
        '<div class="org-card-name">Kurban #' + k.kurban_no + '</div>' +
        '<div class="org-card-year"><span class="badge ' + (k.tur==='buyukbas'?'badge-green':'badge-yellow') + '">' + (k.tur==='buyukbas'?'Büyükbaş':'Küçükbaş') + '</span></div>' +
        '<div class="org-card-stats">' +
        '<div class="org-card-stat"><div class="val" style="color:var(--accent)">' + k.dolu_hisse + '/' + k.toplam_hisse + '</div><div class="lbl">Dolu/Toplam</div></div>' +
        '<div class="org-card-stat"><div class="val" style="color:var(--green)">' + (k.toplam_hisse - k.dolu_hisse) + '</div><div class="lbl">Boş Hisse</div></div>' +
        '</div></div>';
    });
    html += '</div>';
    icerik.innerHTML = html;
  } catch(e) {
    icerik.innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Kurbanlar yüklenemedi</p></div>';
  }
}

function bagisAlYeni() {
  _bagisAlMod = 'yeni';
  const icerik = document.getElementById('bagis-al-icerik');
  icerik.innerHTML = '<div style="margin-bottom:16px;font-size:13px;color:var(--text2)"><i class="fa-solid fa-info-circle" style="color:var(--accent)"></i> Yeni kurban türünü seçin:</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
    '<button class="btn btn-primary" style="padding:18px;font-size:14px;flex-direction:column;gap:6px;height:auto" onclick="bagisAlTurSec(\'buyukbas\')">' +
    '<i class="fa-solid fa-cow" style="font-size:28px"></i><span>Büyükbaş</span><span style="font-size:12px;opacity:0.8">7 Hisse</span></button>' +
    '<button class="btn btn-success" style="padding:18px;font-size:14px;flex-direction:column;gap:6px;height:auto" onclick="bagisAlTurSec(\'kucukbas\')">' +
    '<i class="fa-solid fa-hippo" style="font-size:28px"></i><span>Küçükbaş</span><span style="font-size:12px;opacity:0.8">1 Hisse</span></button></div>';
}

async function bagisAlKurbanSec(kurbanId) {
  try {
    const list = await api('GET', '/organizasyonlar/' + S.orgId + '/kurbanlar');
    _bagisAlKurban = list.find(k => k.id === kurbanId);
    if (!_bagisAlKurban) return toast('Kurban bulunamadı', 'error');
    _bagisAlHisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
    bagisAlFormGoster(_bagisAlKurban.tur, _bagisAlKurban, _bagisAlHisseler);
  } catch(e) { toast(e.message, 'error'); }
}

function bagisAlTurSec(tur) {
  const toplam = tur === 'buyukbas' ? 7 : 1;
  _bagisAlKurban = { tur, toplam_hisse: toplam, id: null };
  _bagisAlHisseler = Array.from({length: toplam}, (_, i) => ({ hisse_no: i+1, bagisci_adi: null }));
  bagisAlFormGoster(tur, _bagisAlKurban, _bagisAlHisseler);
}

function bagisAlFormGoster(tur, kurban, hisseler) {
  const toplam = kurban.toplam_hisse || (tur === 'buyukbas' ? 7 : 1);
  const icerik = document.getElementById('bagis-al-icerik');
  let hisseFormlari = '';
  for (let i = 0; i < toplam; i++) {
    const h = hisseler[i] || {};
    const dolu = h.bagisci_adi ? true : false;
    hisseFormlari += '<div class="card" id="hisse-card-' + i + '" style="margin:0;border:1px solid ' + (dolu?'rgba(16,185,129,0.4)':'var(--border)') + ';background:' + (dolu?'rgba(16,185,129,0.05)':'var(--bg3)') + '">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
      '<div style="width:32px;height:32px;border-radius:8px;background:var(--glow);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:1px solid rgba(79,126,248,.2)">' + (i+1) + '</div>' +
      '<div style="font-weight:600;font-size:14px">' + (toplam===1?'Bağışçı Bilgileri':(i+1)+'. Hisse') + '</div>' +
      '<span id="hisse-badge-' + i + '" class="badge ' + (dolu?'badge-green':'badge-gray') + '" style="margin-left:auto">' + (dolu?'<i class="fa-solid fa-check"></i> Dolu':'Boş') + '</span>' +
      '</div>' +
      '<div class="form-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">' +
      '<div class="form-group"><label>Bağışçı Adı Soyadı *</label><input id="h-ad-' + i + '" value="' + esc(h.bagisci_adi||'') + '" placeholder="Ad Soyad" oninput="hisseGuncelle(' + i + ')"/></div>' +
      '<div class="form-group"><label>Telefon</label><input id="h-tel-' + i + '" value="' + esc(h.bagisci_telefon||'') + '" placeholder="05xx xxx xx xx"/></div>' +
      '<div class="form-group"><label>Kimin Adına</label><input id="h-adina-' + i + '" value="' + esc(h.kimin_adina||'') + '" placeholder="Vefat eden / başka kişi"/></div>' +
      '<div class="form-group"><label>Adına Tel</label><input id="h-adina-tel-' + i + '" value="' + esc(h.kimin_adina_telefon||'') + '" placeholder="Opsiyonel"/></div>' +
      '<div class="form-group"><label>Ödeme Durumu</label><select id="h-odeme-' + i + '">' +
      '<option value="bekliyor" ' + ((h.odeme_durumu||'bekliyor')==='bekliyor'?'selected':'') + '>Bekliyor</option>' +
      '<option value="odendi" ' + (h.odeme_durumu==='odendi'?'selected':'') + '>Ödendi</option>' +
      '<option value="iptal" ' + (h.odeme_durumu==='iptal'?'selected':'') + '>İptal</option>' +
      '</select></div>' +
      '<div class="form-group"><label>Video İster mi?</label><select id="h-video-' + i + '">' +
      '<option value="0" ' + (!h.video_ister?'selected':'') + '>Hayır</option>' +
      '<option value="1" ' + (h.video_ister?'selected':'') + '>Evet</option>' +
      '</select></div>' +
      (h.id ? '<div class="form-group" style="grid-column:1/-1;display:flex;justify-content:flex-end"><button class="btn btn-danger btn-sm" onclick="hisseSil(' + h.id + ',' + i + ')"><i class="fa-solid fa-trash"></i> Hisseyi Temizle</button></div>' : '') +
      '</div></div>';
  }
  const kurbanBilgi = kurban.id
    ? '<div style="background:var(--bg4);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;display:flex;align-items:center;gap:10px"><i class="fa-solid fa-cow" style="color:var(--accent)"></i><span>Kurban <strong>#' + kurban.kurban_no + '</strong> &mdash; ' + (tur==='buyukbas'?'Büyükbaş':'Küçükbaş') + ' &mdash; ' + toplam + ' Hisse</span></div>'
    : '<div style="background:var(--bg4);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;display:flex;align-items:center;gap:10px"><i class="fa-solid fa-plus-circle" style="color:var(--green)"></i><span>Yeni <strong>' + (tur==='buyukbas'?'Büyükbaş':'Küçükbaş') + '</strong> kurban oluşturulacak &mdash; ' + toplam + ' Hisse</span></div>';
  icerik.innerHTML = kurbanBilgi +
    '<div style="display:grid;gap:12px;margin-bottom:20px">' + hisseFormlari + '</div>' +
    '<div class="form-actions">' +
    '<button class="btn btn-secondary" onclick="' + (_bagisAlMod==='mevcut'?'bagisAlMevcut()':'bagisAlYeni()') + '"><i class="fa-solid fa-arrow-left"></i> Geri</button>' +
    '<button class="btn btn-primary" onclick="bagisAlKaydet()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>' +
    '</div>';
}

function hisseGuncelle(idx) {
  const ad = document.getElementById('h-ad-' + idx)?.value?.trim();
  const card = document.getElementById('hisse-card-' + idx);
  const badge = document.getElementById('hisse-badge-' + idx);
  if (!card || !badge) return;
  if (ad) {
    badge.className = 'badge badge-green';
    badge.innerHTML = '<i class="fa-solid fa-check"></i> Dolu';
    card.style.borderColor = 'rgba(16,185,129,0.4)';
    card.style.background = 'rgba(16,185,129,0.05)';
  } else {
    badge.className = 'badge badge-gray';
    badge.innerHTML = 'Boş';
    card.style.borderColor = 'var(--border)';
    card.style.background = 'var(--bg3)';
  }
}

async function hisseSil(hisseId, idx) {
  if (!confirm('Bu hisseyi temizlemek istediğinizden emin misiniz?')) return;
  try {
    await api('DELETE', '/hisseler/' + hisseId + '/temizle');
    toast('Hisse temizlendi');
    bagisAlKurbanSec(_bagisAlKurban.id);
  } catch(e) { toast(e.message, 'error'); }
}

async function bagisAlKaydet() {
  const toplam = _bagisAlKurban.toplam_hisse || (_bagisAlKurban.tur === 'buyukbas' ? 7 : 1);
  const hisseler = [];
  for (let i = 0; i < toplam; i++) {
    hisseler.push({
      bagisci_adi: document.getElementById('h-ad-' + i)?.value?.trim() || null,
      bagisci_telefon: document.getElementById('h-tel-' + i)?.value?.trim() || null,
      kimin_adina: document.getElementById('h-adina-' + i)?.value?.trim() || null,
      kimin_adina_telefon: document.getElementById('h-adina-tel-' + i)?.value?.trim() || null,
      odeme_durumu: document.getElementById('h-odeme-' + i)?.value || 'bekliyor',
      video_ister: parseInt(document.getElementById('h-video-' + i)?.value || '0')
    });
  }
  const dolular = hisseler.filter(h => h.bagisci_adi);
  if (!dolular.length) { toast('En az bir hisse için bağışçı adı girin', 'error'); return; }
  try {
    if (_bagisAlMod === 'mevcut' && _bagisAlKurban.id) {
      for (let i = 0; i < _bagisAlHisseler.length; i++) {
        const h = _bagisAlHisseler[i];
        if (h && h.id) await api('PUT', '/hisseler/' + h.id, hisseler[i]);
      }
      toast(dolular.length + ' bağışçı kaydedildi');
    } else {
      await api('POST', '/organizasyonlar/' + S.orgId + '/kurban-ve-hisseler', { tur: _bagisAlKurban.tur, hisseler });
      toast('Kurban oluşturuldu, ' + dolular.length + ' bağışçı eklendi');
    }
    await loadKurbanlar().catch(() => {});
    renderBagisAlKurban();
  } catch(e) { toast(e.message, 'error'); }
}

async function cikisYap() {
  if (!confirm('Çıkış yapmak istediğinizden emin misiniz?')) return;
  try {
    await fetch('/api/auth/cikis', { method: 'POST' });
  } catch(e) {}
  window.location.href = '/icder-giris';
}


function renderGonulluYonetimi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-hands-helping"></i></div>
        Gönüllü Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniGonullu()">
        <i class="fa-solid fa-plus"></i> Yeni Gönüllü
      </button>
    </div>
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-hands-helping"></i>
        <p>Gönüllü yönetimi geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderKumbaraTalepleri() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-piggy-bank"></i></div>
        Kumbara Talepleri
      </div>
      <button class="btn btn-primary" onclick="modalYeniKumbaraTalebi()">
        <i class="fa-solid fa-plus"></i> Yeni Talep
      </button>
    </div>
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-piggy-bank"></i>
        <p>Kumbara talepleri geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderWebSitesiBagislari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-globe"></i></div>
        Web Sitesi Bağışları
      </div>
      <button class="btn btn-secondary" onclick="senkronizeEtBagislar()">
        <i class="fa-solid fa-sync"></i> Senkronize Et
      </button>
    </div>
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-globe"></i>
        <p>Web sitesi bağışları geliştiriliyor...</p>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function modalYeniBagisTuru() {
  toast('Bağış türü ekleme özelliği yakında eklenecek', 'info');
}

function kaydetBagis() {
  toast('Bağış kaydetme özelliği yakında eklenecek', 'info');
}

function modalYeniGonullu() {
  toast('Gönüllü ekleme özelliği yakında eklenecek', 'info');
}

function modalYeniKumbaraTalebi() {
  toast('Kumbara talebi ekleme özelliği yakında eklenecek', 'info');
}

function senkronizeEtBagislar() {
  toast('Senkronizasyon özelliği yakında eklenecek', 'info');
}

function exportBagisRaporu() {
  toast('Rapor indirme özelliği yakında eklenecek', 'info');
}


// ═══════════════════════════════════════════════════════════════════════════
// DEPO/STOK YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

function renderKategoriTanimlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-tags"></i></div>
        Kategori Tanımları
      </div>
      <button class="btn btn-primary" onclick="modalYeniKategori()">
        <i class="fa-solid fa-plus"></i> Yeni Kategori
      </button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Kategori Adı</th>
              <th>Açıklama</th>
              <th>Ürün Sayısı</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <i class="fa-solid fa-tags"></i>
                  <p>Kategori tanımları geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderUrunTanimlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-box"></i></div>
        Ürün Tanımları
      </div>
      <button class="btn btn-primary" onclick="modalYeniUrun()">
        <i class="fa-solid fa-plus"></i> Yeni Ürün
      </button>
    </div>
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Ürün ara..." oninput="filterUrunler()"/>
        <select onchange="filterUrunler()">
          <option value="">Tüm Kategoriler</option>
          <option value="gida">Gıda</option>
          <option value="temizlik">Temizlik</option>
          <option value="kirtasiye">Kırtasiye</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ürün Adı</th>
              <th>Kategori</th>
              <th>Birim</th>
              <th>Stok Miktarı</th>
              <th>Birim Fiyat</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <i class="fa-solid fa-box"></i>
                  <p>Ürün tanımları geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderStokGirisi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-arrow-down"></i></div>
        Stok Girişi
      </div>
    </div>
    <div class="card">
      <div class="form-grid">
        <div class="form-group">
          <label>Ürün Seç *</label>
          <select id="stok-giris-urun">
            <option value="">Ürün seçin...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Miktar *</label>
          <input type="number" id="stok-giris-miktar" placeholder="0"/>
        </div>
        <div class="form-group">
          <label>Birim Fiyat (TL)</label>
          <input type="number" id="stok-giris-fiyat" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label>Tedarikçi</label>
          <input id="stok-giris-tedarikci" placeholder="Tedarikçi adı"/>
        </div>
        <div class="form-group">
          <label>Fatura No</label>
          <input id="stok-giris-fatura" placeholder="Fatura numarası"/>
        </div>
        <div class="form-group">
          <label>Tarih</label>
          <input type="date" id="stok-giris-tarih" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Not</label>
          <textarea id="stok-giris-not" placeholder="Opsiyonel..."></textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="kaydetStokGirisi()">
          <i class="fa-solid fa-floppy-disk"></i> Stok Girişi Yap
        </button>
      </div>
    </div>
    
    <div class="card" style="margin-top:20px">
      <h3 style="margin-bottom:16px">Son Stok Girişleri</h3>
      <div class="empty-state">
        <i class="fa-solid fa-arrow-down"></i>
        <p>Stok giriş geçmişi geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderStokCikisi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-arrow-up"></i></div>
        Stok Çıkışı
      </div>
    </div>
    <div class="card">
      <div class="form-grid">
        <div class="form-group">
          <label>Ürün Seç *</label>
          <select id="stok-cikis-urun">
            <option value="">Ürün seçin...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Miktar *</label>
          <input type="number" id="stok-cikis-miktar" placeholder="0"/>
        </div>
        <div class="form-group">
          <label>Çıkış Nedeni *</label>
          <select id="stok-cikis-neden">
            <option value="satis">Satış</option>
            <option value="bagis">Bağış</option>
            <option value="fire">Fire</option>
            <option value="iade">İade</option>
            <option value="diger">Diğer</option>
          </select>
        </div>
        <div class="form-group">
          <label>Alıcı/Faydalanıcı</label>
          <input id="stok-cikis-alici" placeholder="Alıcı adı"/>
        </div>
        <div class="form-group">
          <label>Tarih</label>
          <input type="date" id="stok-cikis-tarih" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Not</label>
          <textarea id="stok-cikis-not" placeholder="Opsiyonel..."></textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="kaydetStokCikisi()">
          <i class="fa-solid fa-floppy-disk"></i> Stok Çıkışı Yap
        </button>
      </div>
    </div>
    
    <div class="card" style="margin-top:20px">
      <h3 style="margin-bottom:16px">Son Stok Çıkışları</h3>
      <div class="empty-state">
        <i class="fa-solid fa-arrow-up"></i>
        <p>Stok çıkış geçmişi geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderFaturaRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-file-invoice"></i></div>
        Fatura Raporları
      </div>
      <button class="btn btn-primary" onclick="exportFaturaRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-file-invoice"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Fatura</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-lira-sign"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Tutar</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bekleyen</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-exclamation-triangle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Gecikmiş</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Fatura ara..." />
        <select>
          <option value="">Tüm Durumlar</option>
          <option value="odendi">Ödendi</option>
          <option value="bekliyor">Bekliyor</option>
          <option value="gecikti">Gecikti</option>
        </select>
        <input type="date" placeholder="Başlangıç"/>
        <input type="date" placeholder="Bitiş"/>
      </div>
      <div class="empty-state">
        <i class="fa-solid fa-file-invoice"></i>
        <p>Fatura raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderDepoSayimi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-clipboard-check"></i></div>
        Depo Sayımı
      </div>
      <button class="btn btn-primary" onclick="modalYeniSayim()">
        <i class="fa-solid fa-plus"></i> Yeni Sayım Başlat
      </button>
    </div>
    
    <div class="card">
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card blue">
          <div class="stat-icon"><i class="fa-solid fa-box"></i></div>
          <div class="stat-value">0</div>
          <div class="stat-label">Toplam Ürün</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
          <div class="stat-value">0</div>
          <div class="stat-label">Sayıldı</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
          <div class="stat-value">0</div>
          <div class="stat-label">Bekliyor</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon"><i class="fa-solid fa-exclamation-circle"></i></div>
          <div class="stat-value">0</div>
          <div class="stat-label">Fark Var</div>
        </div>
      </div>
      
      <div class="empty-state">
        <i class="fa-solid fa-clipboard-check"></i>
        <p>Depo sayımı geliştiriliyor...</p>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function modalYeniKategori() {
  toast('Kategori ekleme özelliği yakında eklenecek', 'info');
}

function modalYeniUrun() {
  toast('Ürün ekleme özelliği yakında eklenecek', 'info');
}

function filterUrunler() {
  // Ürün filtreleme
}

function kaydetStokGirisi() {
  toast('Stok girişi özelliği yakında eklenecek', 'info');
}

function kaydetStokCikisi() {
  toast('Stok çıkışı özelliği yakında eklenecek', 'info');
}

function exportFaturaRaporu() {
  toast('Fatura raporu indirme özelliği yakında eklenecek', 'info');
}

function modalYeniSayim() {
  toast('Sayım başlatma özelliği yakında eklenecek', 'info');
}


// ═══════════════════════════════════════════════════════════════════════════
// YARDIM YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

function renderYardimRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-chart-pie"></i></div>
        Yardım Raporları
      </div>
      <button class="btn btn-primary" onclick="exportYardimRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-hands-helping"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Yardım</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Tamamlanan</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Devam Eden</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Faydalanan Kişi</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Rapor ara..." />
        <select>
          <option value="">Tüm Yardım Türleri</option>
          <option value="gida">Gıda Yardımı</option>
          <option value="egitim">Eğitim Yardımı</option>
          <option value="saglik">Sağlık Yardımı</option>
          <option value="nakit">Nakit Yardım</option>
        </select>
        <input type="date" placeholder="Başlangıç"/>
        <input type="date" placeholder="Bitiş"/>
      </div>
      <div class="empty-state">
        <i class="fa-solid fa-chart-pie"></i>
        <p>Yardım raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderBasvuruDosyalari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-folder-open"></i></div>
        Başvuru Dosyaları
      </div>
      <button class="btn btn-primary" onclick="modalYeniBasvuru()">
        <i class="fa-solid fa-plus"></i> Yeni Başvuru
      </button>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Başvuru ara..." oninput="filterBasvurular()"/>
        <select onchange="filterBasvurular()">
          <option value="">Tüm Durumlar</option>
          <option value="beklemede">Beklemede</option>
          <option value="inceleniyor">İnceleniyor</option>
          <option value="onaylandi">Onaylandı</option>
          <option value="reddedildi">Reddedildi</option>
        </select>
        <select onchange="filterBasvurular()">
          <option value="">Tüm Türler</option>
          <option value="gida">Gıda Yardımı</option>
          <option value="egitim">Eğitim Yardımı</option>
          <option value="saglik">Sağlık Yardımı</option>
          <option value="nakit">Nakit Yardım</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Başvuru No</th>
              <th>Ad Soyad</th>
              <th>Yardım Türü</th>
              <th>Başvuru Tarihi</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <i class="fa-solid fa-folder-open"></i>
                  <p>Başvuru dosyaları geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderYetimOksuzYonetimi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-child"></i></div>
        Yetim-Öksüz Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniYetim()">
        <i class="fa-solid fa-plus"></i> Yeni Kayıt
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-child"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Kayıt</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Eğitim Desteği</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-heart"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Sağlık Desteği</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-home"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Barınma Desteği</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="İsim ara..." oninput="filterYetimler()"/>
        <select onchange="filterYetimler()">
          <option value="">Tüm Yaş Grupları</option>
          <option value="0-6">0-6 Yaş</option>
          <option value="7-12">7-12 Yaş</option>
          <option value="13-18">13-18 Yaş</option>
        </select>
        <select onchange="filterYetimler()">
          <option value="">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ad Soyad</th>
              <th>Yaş</th>
              <th>Veli/Vasi</th>
              <th>Telefon</th>
              <th>Destek Türü</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="8">
                <div class="empty-state">
                  <i class="fa-solid fa-child"></i>
                  <p>Yetim-öksüz yönetimi geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderIhtiyacSahibiListesi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-users"></i></div>
        İhtiyaç Sahibi Kişi Listesi
      </div>
      <button class="btn btn-primary" onclick="modalYeniIhtiyacSahibi()">
        <i class="fa-solid fa-plus"></i> Yeni Kişi Ekle
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Kişi</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Yardım Alanlar</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bekleyenler</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-exclamation-triangle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Acil Durum</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="İsim, TC No ara..." oninput="filterIhtiyacSahibi()"/>
        <select onchange="filterIhtiyacSahibi()">
          <option value="">Tüm İhtiyaç Türleri</option>
          <option value="gida">Gıda</option>
          <option value="giyim">Giyim</option>
          <option value="egitim">Eğitim</option>
          <option value="saglik">Sağlık</option>
          <option value="nakit">Nakit</option>
        </select>
        <select onchange="filterIhtiyacSahibi()">
          <option value="">Tüm Öncelikler</option>
          <option value="acil">Acil</option>
          <option value="yuksek">Yüksek</option>
          <option value="orta">Orta</option>
          <option value="dusuk">Düşük</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ad Soyad</th>
              <th>TC No</th>
              <th>Telefon</th>
              <th>Adres</th>
              <th>İhtiyaç Türü</th>
              <th>Öncelik</th>
              <th>Son Yardım</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="9">
                <div class="empty-state">
                  <i class="fa-solid fa-users"></i>
                  <p>İhtiyaç sahibi listesi geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function exportYardimRaporu() {
  toast('Yardım raporu indirme özelliği yakında eklenecek', 'info');
}

function modalYeniBasvuru() {
  toast('Başvuru ekleme özelliği yakında eklenecek', 'info');
}

function filterBasvurular() {
  // Başvuru filtreleme
}

function modalYeniYetim() {
  toast('Yetim kaydı ekleme özelliği yakında eklenecek', 'info');
}

function filterYetimler() {
  // Yetim filtreleme
}

function modalYeniIhtiyacSahibi() {
  toast('İhtiyaç sahibi ekleme özelliği yakında eklenecek', 'info');
}

function filterIhtiyacSahibi() {
  // İhtiyaç sahibi filtreleme
}


// ═══════════════════════════════════════════════════════════════════════════
// ORGANİZASYON YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

function renderSuKuyusuOrganizasyonu() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-water"></i></div>
        Su Kuyusu Organizasyonu
      </div>
      <button class="btn btn-primary" onclick="modalYeniSuKuyusu()">
        <i class="fa-solid fa-plus"></i> Yeni Su Kuyusu
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-water"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Kuyu</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Tamamlanan</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Devam Eden</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-lira-sign"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Bütçe</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Kuyu ara..." oninput="filterSuKuyusu()"/>
        <select onchange="filterSuKuyusu()">
          <option value="">Tüm Durumlar</option>
          <option value="planlama">Planlama</option>
          <option value="devam">Devam Ediyor</option>
          <option value="tamamlandi">Tamamlandı</option>
        </select>
        <select onchange="filterSuKuyusu()">
          <option value="">Tüm Ülkeler</option>
          <option value="afrika">Afrika</option>
          <option value="asya">Asya</option>
          <option value="ortadogu">Orta Doğu</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Kuyu Adı</th>
              <th>Konum</th>
              <th>Bütçe</th>
              <th>Toplanan</th>
              <th>Durum</th>
              <th>Başlangıç</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="8">
                <div class="empty-state">
                  <i class="fa-solid fa-water"></i>
                  <p>Su kuyusu organizasyonu geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderProjeYonetimi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-project-diagram"></i></div>
        Proje Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniProje()">
        <i class="fa-solid fa-plus"></i> Yeni Proje
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-project-diagram"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Proje</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Tamamlanan</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-spinner"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Devam Eden</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-pause-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Beklemede</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Proje ara..." oninput="filterProjeler()"/>
        <select onchange="filterProjeler()">
          <option value="">Tüm Kategoriler</option>
          <option value="egitim">Eğitim</option>
          <option value="saglik">Sağlık</option>
          <option value="altyapi">Alt Yapı</option>
          <option value="sosyal">Sosyal</option>
        </select>
        <select onchange="filterProjeler()">
          <option value="">Tüm Durumlar</option>
          <option value="planlama">Planlama</option>
          <option value="devam">Devam Ediyor</option>
          <option value="tamamlandi">Tamamlandı</option>
          <option value="beklemede">Beklemede</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Proje Adı</th>
              <th>Kategori</th>
              <th>Bütçe</th>
              <th>Harcanan</th>
              <th>İlerleme</th>
              <th>Durum</th>
              <th>Sorumlu</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="9">
                <div class="empty-state">
                  <i class="fa-solid fa-project-diagram"></i>
                  <p>Proje yönetimi geliştiriliyor...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderDigerOrganizasyonlar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-sitemap"></i></div>
        Diğer Organizasyonlar
      </div>
      <button class="btn btn-primary" onclick="modalYeniDigerOrganizasyon()">
        <i class="fa-solid fa-plus"></i> Yeni Organizasyon
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-sitemap"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Organizasyon</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Aktif</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Planlanan</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-archive"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Arşivlenen</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Organizasyon ara..." oninput="filterDigerOrg()"/>
        <select onchange="filterDigerOrg()">
          <option value="">Tüm Türler</option>
          <option value="etkinlik">Etkinlik</option>
          <option value="kampanya">Kampanya</option>
          <option value="yardim">Yardım Kampanyası</option>
          <option value="egitim">Eğitim Programı</option>
        </select>
        <select onchange="filterDigerOrg()">
          <option value="">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="planlanan">Planlanan</option>
          <option value="tamamlandi">Tamamlandı</option>
          <option value="iptal">İptal Edildi</option>
        </select>
      </div>
      <div class="org-grid" id="diger-org-grid">
        <div class="empty-state">
          <i class="fa-solid fa-sitemap"></i>
          <p>Diğer organizasyonlar geliştiriliyor...</p>
        </div>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function modalYeniSuKuyusu() {
  toast('Su kuyusu ekleme özelliği yakında eklenecek', 'info');
}

function filterSuKuyusu() {
  // Su kuyusu filtreleme
}

function modalYeniProje() {
  toast('Proje ekleme özelliği yakında eklenecek', 'info');
}

function filterProjeler() {
  // Proje filtreleme
}

function modalYeniDigerOrganizasyon() {
  toast('Organizasyon ekleme özelliği yakında eklenecek', 'info');
}

function filterDigerOrg() {
  // Diğer organizasyon filtreleme
}


// ═══════════════════════════════════════════════════════════════════════════
// RAPOR YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

function renderHissedarRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-users"></i></div>
        Hissedar Raporları
      </div>
      <button class="btn btn-primary" onclick="exportHissedarRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Hissedar</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Ödeme Yapan</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bekleyen</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-lira-sign"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Tutar</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Hissedar ara..." />
        <select>
          <option value="">Tüm Organizasyonlar</option>
        </select>
        <input type="date" placeholder="Başlangıç"/>
        <input type="date" placeholder="Bitiş"/>
      </div>
      <div class="empty-state">
        <i class="fa-solid fa-users"></i>
        <p>Hissedar raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderSuKuyusuRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-water"></i></div>
        Su Kuyusu Raporları
      </div>
      <button class="btn btn-primary" onclick="exportSuKuyusuRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-water"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Kuyu</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Tamamlanan</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-spinner"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Devam Eden</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-lira-sign"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Bütçe</div>
      </div>
    </div>
    
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-water"></i>
        <p>Su kuyusu raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderBagisciRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-user-tie"></i></div>
        Bağışçı Raporları
      </div>
      <button class="btn btn-primary" onclick="exportBagisciRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-user-tie"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Bağışçı</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-star"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Aktif Bağışçı</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-hand-holding-heart"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Bağış</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-lira-sign"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Tutar</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Bağışçı ara..." />
        <select>
          <option value="">Tüm Bağış Türleri</option>
          <option value="nakit">Nakit</option>
          <option value="kumbara">Kumbara</option>
          <option value="online">Online</option>
        </select>
        <input type="date" placeholder="Başlangıç"/>
        <input type="date" placeholder="Bitiş"/>
      </div>
      <div class="empty-state">
        <i class="fa-solid fa-user-tie"></i>
        <p>Bağışçı raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderIhtiyacSahibiRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-hands-helping"></i></div>
        İhtiyaç Sahibi Raporları
      </div>
      <button class="btn btn-primary" onclick="exportIhtiyacSahibiRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Kişi</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Yardım Yapılan</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bekleyen</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-exclamation-triangle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Acil Durum</div>
      </div>
    </div>
    
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-hands-helping"></i>
        <p>İhtiyaç sahibi raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderTahsilatRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-money-bill-wave"></i></div>
        Tahsilat Raporları
      </div>
      <button class="btn btn-primary" onclick="exportTahsilatRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-money-bill-wave"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Tahsilat</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-credit-card"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Kredi Kartı</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-money-bill"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Nakit</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-university"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Banka Transferi</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <select>
          <option value="">Tüm Ödeme Yöntemleri</option>
          <option value="nakit">Nakit</option>
          <option value="kredi-karti">Kredi Kartı</option>
          <option value="banka">Banka Transferi</option>
        </select>
        <input type="date" placeholder="Başlangıç"/>
        <input type="date" placeholder="Bitiş"/>
      </div>
      <div class="empty-state">
        <i class="fa-solid fa-money-bill-wave"></i>
        <p>Tahsilat raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderBankaServisleri() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-university"></i></div>
        Banka Servisleri
      </div>
      <button class="btn btn-primary" onclick="senkronizeBanka()">
        <i class="fa-solid fa-sync"></i> Senkronize Et
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-university"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bağlı Banka</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-wallet"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Toplam Bakiye</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-exchange-alt"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bugünkü İşlem</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">-</div>
        <div class="stat-label">Son Senkronizasyon</div>
      </div>
    </div>
    
    <div class="card">
      <div class="empty-state">
        <i class="fa-solid fa-university"></i>
        <p>Banka servisleri geliştiriliyor...</p>
      </div>
    </div>`;
}

function renderSponsorPeriyotRaporlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-calendar-alt"></i></div>
        Sponsor Periyot Raporları
      </div>
      <button class="btn btn-primary" onclick="exportSponsorPeriyotRaporu()">
        <i class="fa-solid fa-file-excel"></i> Excel İndir
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-handshake"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Aktif Sponsor</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-lira-sign"></i></div>
        <div class="stat-value">0 ₺</div>
        <div class="stat-label">Aylık Toplam</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bu Ay Ödenen</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-exclamation-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Gecikmiş</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input placeholder="Sponsor ara..." />
        <select>
          <option value="">Tüm Periyotlar</option>
          <option value="aylik">Aylık</option>
          <option value="3aylik">3 Aylık</option>
          <option value="6aylik">6 Aylık</option>
          <option value="yillik">Yıllık</option>
        </select>
        <select>
          <option value="">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="beklemede">Beklemede</option>
          <option value="gecikti">Gecikti</option>
        </select>
      </div>
      <div class="empty-state">
        <i class="fa-solid fa-calendar-alt"></i>
        <p>Sponsor periyot raporları geliştiriliyor...</p>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function exportHissedarRaporu() {
  toast('Hissedar raporu indirme özelliği yakında eklenecek', 'info');
}

function exportSuKuyusuRaporu() {
  toast('Su kuyusu raporu indirme özelliği yakında eklenecek', 'info');
}

function exportBagisciRaporu() {
  toast('Bağışçı raporu indirme özelliği yakında eklenecek', 'info');
}

function exportIhtiyacSahibiRaporu() {
  toast('İhtiyaç sahibi raporu indirme özelliği yakında eklenecek', 'info');
}

function exportTahsilatRaporu() {
  toast('Tahsilat raporu indirme özelliği yakında eklenecek', 'info');
}

function senkronizeBanka() {
  toast('Banka senkronizasyonu özelliği yakında eklenecek', 'info');
}

function exportSponsorPeriyotRaporu() {
  toast('Sponsor periyot raporu indirme özelliği yakında eklenecek', 'info');
}


// ═══════════════════════════════════════════════════════════════════════════
// KİŞİSEL YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════

function renderProfilBilgilerim() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-user-circle"></i></div>
        Profil Bilgilerim
      </div>
    </div>
    
    <div class="card">
      <div style="display:flex;gap:30px;align-items:start">
        <div style="text-align:center">
          <div style="width:150px;height:150px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;margin-bottom:15px;border:3px solid var(--accent)">
            <i class="fa-solid fa-user" style="font-size:60px;color:var(--text3)"></i>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="degistirProfilFoto()">
            <i class="fa-solid fa-camera"></i> Fotoğraf Değiştir
          </button>
        </div>
        
        <div style="flex:1">
          <div class="form-grid">
            <div class="form-group">
              <label>Ad Soyad *</label>
              <input id="profil-adsoyad" value="İÇDER Kullanıcı" placeholder="Ad Soyad"/>
            </div>
            <div class="form-group">
              <label>E-posta *</label>
              <input id="profil-email" type="email" value="kullanici@icder.org" placeholder="E-posta"/>
            </div>
            <div class="form-group">
              <label>Telefon</label>
              <input id="profil-telefon" placeholder="0 (5__) ___ __ __"/>
            </div>
            <div class="form-group">
              <label>Görev/Pozisyon</label>
              <input id="profil-gorev" placeholder="Görev"/>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Biyografi</label>
              <textarea id="profil-bio" rows="3" placeholder="Kendiniz hakkında kısa bilgi..."></textarea>
            </div>
          </div>
          
          <hr style="margin:20px 0;border:none;border-top:1px solid var(--border)"/>
          
          <h3 style="margin-bottom:15px;font-size:16px">Şifre Değiştir</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Mevcut Şifre</label>
              <input id="profil-eski-sifre" type="password" placeholder="Mevcut şifre" autocomplete="new-password"/>
            </div>
            <div class="form-group">
              <label>Yeni Şifre</label>
              <input id="profil-yeni-sifre" type="password" placeholder="Yeni şifre" autocomplete="new-password"/>
            </div>
            <div class="form-group">
              <label>Yeni Şifre Tekrar</label>
              <input id="profil-yeni-sifre-tekrar" type="password" placeholder="Yeni şifre tekrar" autocomplete="new-password"/>
            </div>
          </div>
          
          <div class="form-actions" style="margin-top:20px">
            <button class="btn btn-primary" onclick="kaydetProfilBilgileri()">
              <i class="fa-solid fa-floppy-disk"></i> Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderOzelMesajlar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-envelope"></i></div>
        Özel Mesajlar
      </div>
      <button class="btn btn-primary" onclick="modalYeniMesaj()">
        <i class="fa-solid fa-plus"></i> Yeni Mesaj
      </button>
    </div>
    
    <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;height:calc(100vh - 200px)">
      <div class="card" style="margin:0;overflow-y:auto">
        <div style="margin-bottom:15px">
          <input placeholder="Mesaj ara..." style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg3);color:var(--text)"/>
        </div>
        
        <div id="mesaj-listesi">
          <div class="empty-state" style="padding:40px 20px">
            <i class="fa-solid fa-envelope"></i>
            <p style="font-size:13px">Mesaj bulunamadı</p>
          </div>
        </div>
      </div>
      
      <div class="card" style="margin:0;display:flex;flex-direction:column">
        <div style="flex:1;overflow-y:auto;padding:20px;background:var(--bg3);border-radius:8px;margin-bottom:15px">
          <div class="empty-state">
            <i class="fa-solid fa-comments"></i>
            <p>Bir mesaj seçin</p>
          </div>
        </div>
        
        <div style="display:flex;gap:10px">
          <input placeholder="Mesajınızı yazın..." style="flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;background:var(--bg3);color:var(--text)"/>
          <button class="btn btn-primary">
            <i class="fa-solid fa-paper-plane"></i> Gönder
          </button>
        </div>
      </div>
    </div>`;
}

function renderGorevBildirimlerim() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-bell"></i></div>
        Görev Bildirimlerim
      </div>
      <button class="btn btn-secondary" onclick="tumunuOkunduIsaretle()">
        <i class="fa-solid fa-check-double"></i> Tümünü Okundu İşaretle
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-bell"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Toplam Bildirim</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-envelope"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Okunmamış</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-tasks"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Bekleyen Görev</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">0</div>
        <div class="stat-label">Tamamlanan</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <select onchange="filterBildirimler()">
          <option value="">Tüm Bildirimler</option>
          <option value="okunmamis">Okunmamış</option>
          <option value="okunmus">Okunmuş</option>
        </select>
        <select onchange="filterBildirimler()">
          <option value="">Tüm Türler</option>
          <option value="gorev">Görev</option>
          <option value="mesaj">Mesaj</option>
          <option value="sistem">Sistem</option>
          <option value="uyari">Uyarı</option>
        </select>
      </div>
      
      <div id="bildirim-listesi">
        <div class="empty-state">
          <i class="fa-solid fa-bell-slash"></i>
          <p>Henüz bildirim yok</p>
        </div>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function degistirProfilFoto() {
  toast('Profil fotoğrafı değiştirme özelliği yakında eklenecek', 'info');
}

function kaydetProfilBilgileri() {
  toast('Profil bilgileri kaydetme özelliği yakında eklenecek', 'info');
}

function modalYeniMesaj() {
  toast('Yeni mesaj gönderme özelliği yakında eklenecek', 'info');
}

function tumunuOkunduIsaretle() {
  toast('Tümünü okundu işaretleme özelliği yakında eklenecek', 'info');
}

function filterBildirimler() {
  // Bildirim filtreleme
}


// ═══════════════════════════════════════════════════════════════════════════
// DESTEK HATTI / ÇAĞRI MERKEZİ
// ═══════════════════════════════════════════════════════════════════════════

async function renderDestekHatti() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-headset"></i></div>
        Destek Hattı
      </div>
      <button class="btn btn-primary" onclick="modalYeniDestek()">
        <i class="fa-solid fa-plus"></i> Yeni Destek Talebi
      </button>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-title"><i class="fa-solid fa-phone"></i> İletişim</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:8px">
          <i class="fa-solid fa-phone" style="color:var(--green);font-size:18px"></i>
          <div><div style="font-size:11px;color:var(--text3)">Telefon</div><div style="font-weight:600">0 (536) 835 10 08</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:8px">
          <i class="fa-solid fa-envelope" style="color:var(--accent);font-size:18px"></i>
          <div><div style="font-size:11px;color:var(--text3)">E-posta</div><div style="font-weight:600">icderkurban@hotmail.com</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:8px">
          <i class="fa-brands fa-whatsapp" style="color:var(--green);font-size:18px"></i>
          <div><div style="font-size:11px;color:var(--text3)">WhatsApp</div><div style="font-weight:600">0 (540) 305 18 55</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:8px">
          <i class="fa-solid fa-clock" style="color:var(--yellow);font-size:18px"></i>
          <div><div style="font-size:11px;color:var(--text3)">Çalışma Saatleri</div><div style="font-weight:600">7/24</div></div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0">Destek Taleplerim</h3>
        <button class="btn btn-secondary btn-sm" onclick="yukleDestekTalepleri()">
          <i class="fa-solid fa-refresh"></i> Yenile
        </button>
      </div>
      <div id="destek-talep-listesi">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  
  await yukleDestekTalepleri();
}

async function yukleDestekTalepleri() {
  const el = document.getElementById('destek-talep-listesi');
  if (!el) return;
  try {
    const list = await api('GET', '/destek/taleplerim');
    if (!list.length) {
      el.innerHTML = `<div class="empty-state">
        <i class="fa-solid fa-headset"></i>
        <p>Henüz destek talebi bulunmuyor</p>
        <button class="btn btn-primary" onclick="modalYeniDestek()" style="margin-top:15px">
          <i class="fa-solid fa-plus"></i> İlk Talebi Oluştur
        </button>
      </div>`;
      return;
    }
    const durumRenk = { bekliyor: 'badge-yellow', inceleniyor: 'badge-blue', cevaplandi: 'badge-green', kapandi: 'badge-gray' };
    const durumText = { bekliyor: 'Bekliyor', inceleniyor: 'İnceleniyor', cevaplandi: 'Cevaplandı', kapandi: 'Kapatıldı' };
    let html = '<div class="table-wrap"><table><thead><tr><th>#</th><th>Başlık</th><th>Durum</th><th>Oluşturma</th><th>Admin Cevabı</th></tr></thead><tbody>';
    list.forEach((t, i) => {
      const tarih = new Date(t.olusturma).toLocaleDateString('tr-TR');
      html += '<tr>';
      html += '<td>' + (i+1) + '</td>';
      html += '<td><strong>' + esc(t.baslik) + '</strong><div style="font-size:12px;color:var(--text3);margin-top:2px">' + esc(t.icerik.substring(0,60)) + (t.icerik.length>60?'...':'') + '</div></td>';
      html += '<td><span class="badge ' + (durumRenk[t.durum]||'badge-gray') + '">' + (durumText[t.durum]||t.durum) + '</span></td>';
      html += '<td style="font-size:12px;color:var(--text3)">' + tarih + '</td>';
      html += '<td>' + (t.admin_cevap ? '<span style="color:var(--green)">' + esc(t.admin_cevap) + '</span>' : '<span style="color:var(--text3)">-</span>') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Talepler yüklenemedi: ' + e.message + '</p></div>';
  }
}

function modalYeniDestek() {
  openModal('Yeni Destek Talebi', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Konu / Başlık *</label>
        <input id="destek-konu" placeholder="Talep konusu"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Açıklama *</label>
        <textarea id="destek-aciklama" rows="5" placeholder="Sorununuzu detaylı açıklayın..."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="gonderDestekTalebi()">
        <i class="fa-solid fa-paper-plane"></i> Talep Gönder
      </button>
    </div>
  `, false, 'headset');
}

async function gonderDestekTalebi() {
  const baslik = document.getElementById('destek-konu')?.value?.trim();
  const icerik = document.getElementById('destek-aciklama')?.value?.trim();
  if (!baslik || !icerik) { toast('Lütfen tüm alanları doldurun', 'error'); return; }
  try {
    await api('POST', '/destek/talep-olustur', { baslik, icerik });
    toast('Destek talebi oluşturuldu');
    closeModal();
    await yukleDestekTalepleri();
  } catch(e) { toast(e.message, 'error'); }
}

function filterDestekTalepleri() { yukleDestekTalepleri(); }
// PARTNER KURULUŞ
// ═══════════════════════════════════════════════════════════════════════════

function renderPartnerKurumListesi() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-handshake"></i></div>
        Partner Kurum Listesi
      </div>
      <button class="btn btn-primary" onclick="modalYeniPartner()">
        <i class="fa-solid fa-plus"></i> Yeni Partner Ekle
      </button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-building"></i></div>
        <div class="stat-value">12</div>
        <div class="stat-label">Toplam Partner</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-value">10</div>
        <div class="stat-label">Aktif Partner</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-value">2</div>
        <div class="stat-label">Beklemede</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><i class="fa-solid fa-handshake-angle"></i></div>
        <div class="stat-value">45</div>
        <div class="stat-label">Toplam İşbirliği</div>
      </div>
    </div>
    
    <div class="card">
      <div class="filter-bar" style="margin-bottom:16px">
        <input id="partner-ara" placeholder="Partner ara..." oninput="filterPartnerler()"/>
        <select id="partner-durum" onchange="filterPartnerler()">
          <option value="">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="beklemede">Beklemede</option>
          <option value="pasif">Pasif</option>
        </select>
        <select id="partner-kategori" onchange="filterPartnerler()">
          <option value="">Tüm Kategoriler</option>
          <option value="dernekler">Dernekler</option>
          <option value="vakiflar">Vakıflar</option>
          <option value="belediyeler">Belediyeler</option>
          <option value="okullar">Okullar</option>
          <option value="diger">Diğer</option>
        </select>
      </div>
      
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Kurum Adı</th>
              <th>Kategori</th>
              <th>Yetkili Kişi</th>
              <th>İletişim</th>
              <th>Şehir</th>
              <th>İşbirliği Sayısı</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <div style="font-weight:600">Yardım Eli Derneği</div>
                <div style="font-size:12px;color:var(--text3)">Kayıt: 15.01.2024</div>
              </td>
              <td><span class="badge badge-blue">Dernekler</span></td>
              <td>
                <div>Ahmet Yılmaz</div>
                <div style="font-size:12px;color:var(--text3)">Başkan</div>
              </td>
              <td>
                <div style="font-size:13px"><i class="fa-solid fa-phone" style="color:var(--accent)"></i> 0532 123 4567</div>
                <div style="font-size:12px;color:var(--text3)"><i class="fa-solid fa-envelope"></i> info@yardimeli.org</div>
              </td>
              <td>İstanbul</td>
              <td><span style="color:var(--green);font-weight:600">15</span></td>
              <td><span class="badge badge-green">Aktif</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="modalDuzenlePartner(1)" title="Düzenle">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="gorPartnerDetay(1)" title="Detay">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="silPartner(1)" title="Sil">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>2</td>
              <td>
                <div style="font-weight:600">Hayır Vakfı</div>
                <div style="font-size:12px;color:var(--text3)">Kayıt: 20.02.2024</div>
              </td>
              <td><span class="badge badge-purple">Vakıflar</span></td>
              <td>
                <div>Mehmet Demir</div>
                <div style="font-size:12px;color:var(--text3)">Genel Müdür</div>
              </td>
              <td>
                <div style="font-size:13px"><i class="fa-solid fa-phone" style="color:var(--accent)"></i> 0533 987 6543</div>
                <div style="font-size:12px;color:var(--text3)"><i class="fa-solid fa-envelope"></i> iletisim@hayirvakfi.org</div>
              </td>
              <td>Ankara</td>
              <td><span style="color:var(--green);font-weight:600">12</span></td>
              <td><span class="badge badge-green">Aktif</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="modalDuzenlePartner(2)" title="Düzenle">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="gorPartnerDetay(2)" title="Detay">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="silPartner(2)" title="Sil">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>3</td>
              <td>
                <div style="font-weight:600">Kardeşlik Derneği</div>
                <div style="font-size:12px;color:var(--text3)">Kayıt: 10.03.2024</div>
              </td>
              <td><span class="badge badge-blue">Dernekler</span></td>
              <td>
                <div>Fatma Kaya</div>
                <div style="font-size:12px;color:var(--text3)">Koordinatör</div>
              </td>
              <td>
                <div style="font-size:13px"><i class="fa-solid fa-phone" style="color:var(--accent)"></i> 0534 555 7788</div>
                <div style="font-size:12px;color:var(--text3)"><i class="fa-solid fa-envelope"></i> bilgi@kardeslik.org</div>
              </td>
              <td>İzmir</td>
              <td><span style="color:var(--yellow);font-weight:600">8</span></td>
              <td><span class="badge badge-yellow">Beklemede</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="modalDuzenlePartner(3)" title="Düzenle">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="gorPartnerDetay(3)" title="Detay">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="silPartner(3)" title="Sil">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="card" style="margin-top:20px">
      <h3 style="margin-bottom:15px;display:flex;align-items:center;gap:8px">
        <i class="fa-solid fa-chart-line" style="color:var(--accent)"></i>
        İşbirliği İstatistikleri
      </h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px">
        <div style="background:var(--bg3);padding:15px;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--blue);margin-bottom:5px">156</div>
          <div style="font-size:13px;color:var(--text3)">Toplam Proje</div>
        </div>
        <div style="background:var(--bg3);padding:15px;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--green);margin-bottom:5px">89</div>
          <div style="font-size:13px;color:var(--text3)">Tamamlanan</div>
        </div>
        <div style="background:var(--bg3);padding:15px;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--yellow);margin-bottom:5px">45</div>
          <div style="font-size:13px;color:var(--text3)">Devam Eden</div>
        </div>
        <div style="background:var(--bg3);padding:15px;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--purple);margin-bottom:5px">22</div>
          <div style="font-size:13px;color:var(--text3)">Planlanan</div>
        </div>
      </div>
    </div>`;
}

// Placeholder fonksiyonlar
function modalYeniPartner() {
  openModal('Yeni Partner Kurum Ekle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Kurum Adı *</label>
        <input id="partner-ad" placeholder="Kurum adını girin"/>
      </div>
      <div class="form-group">
        <label>Kategori *</label>
        <select id="partner-kategori-sec">
          <option value="">Kategori seçin...</option>
          <option value="dernekler">Dernekler</option>
          <option value="vakiflar">Vakıflar</option>
          <option value="belediyeler">Belediyeler</option>
          <option value="okullar">Okullar</option>
          <option value="diger">Diğer</option>
        </select>
      </div>
      <div class="form-group">
        <label>Durum *</label>
        <select id="partner-durum-sec">
          <option value="aktif">Aktif</option>
          <option value="beklemede">Beklemede</option>
          <option value="pasif">Pasif</option>
        </select>
      </div>
      <div class="form-group">
        <label>Yetkili Kişi *</label>
        <input id="partner-yetkili" placeholder="Ad Soyad"/>
      </div>
      <div class="form-group">
        <label>Ünvan</label>
        <input id="partner-unvan" placeholder="Başkan, Müdür, vb."/>
      </div>
      <div class="form-group">
        <label>Telefon *</label>
        <input id="partner-telefon" placeholder="0532 123 4567"/>
      </div>
      <div class="form-group">
        <label>E-posta</label>
        <input id="partner-email" type="email" placeholder="ornek@kurum.org"/>
      </div>
      <div class="form-group">
        <label>Şehir *</label>
        <input id="partner-sehir" placeholder="İstanbul"/>
      </div>
      <div class="form-group">
        <label>İlçe</label>
        <input id="partner-ilce" placeholder="Kadıköy"/>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Adres</label>
        <textarea id="partner-adres" rows="2" placeholder="Tam adres..."></textarea>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Notlar</label>
        <textarea id="partner-notlar" rows="3" placeholder="İşbirliği notları, özel bilgiler..."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="kaydetPartner()">
        <i class="fa-solid fa-floppy-disk"></i> Kaydet
      </button>
    </div>
  `, true, 'handshake');
}

function kaydetPartner() {
  toast('Partner kurum ekleme özelliği geliştiriliyor...', 'info');
  closeModal();
}

function modalDuzenlePartner(id) {
  toast('Partner düzenleme özelliği geliştiriliyor...', 'info');
}

function gorPartnerDetay(id) {
  openModal('Partner Kurum Detayı', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <h4 style="margin-bottom:15px;color:var(--accent)">Kurum Bilgileri</h4>
        <div style="background:var(--bg3);padding:15px;border-radius:8px;margin-bottom:15px">
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Kurum Adı</div>
            <div style="font-weight:600">Yardım Eli Derneği</div>
          </div>
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Kategori</div>
            <div><span class="badge badge-blue">Dernekler</span></div>
          </div>
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Durum</div>
            <div><span class="badge badge-green">Aktif</span></div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Kayıt Tarihi</div>
            <div>15.01.2024</div>
          </div>
        </div>
        
        <h4 style="margin-bottom:15px;color:var(--accent)">İletişim Bilgileri</h4>
        <div style="background:var(--bg3);padding:15px;border-radius:8px">
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Yetkili Kişi</div>
            <div style="font-weight:600">Ahmet Yılmaz</div>
            <div style="font-size:12px;color:var(--text3)">Başkan</div>
          </div>
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Telefon</div>
            <div><i class="fa-solid fa-phone" style="color:var(--accent)"></i> 0532 123 4567</div>
          </div>
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">E-posta</div>
            <div><i class="fa-solid fa-envelope" style="color:var(--accent)"></i> info@yardimeli.org</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text3);margin-bottom:3px">Adres</div>
            <div style="font-size:13px">İstanbul, Kadıköy</div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 style="margin-bottom:15px;color:var(--accent)">İşbirliği İstatistikleri</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
          <div style="background:var(--bg3);padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:var(--blue)">15</div>
            <div style="font-size:11px;color:var(--text3)">Toplam İşbirliği</div>
          </div>
          <div style="background:var(--bg3);padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:var(--green)">12</div>
            <div style="font-size:11px;color:var(--text3)">Tamamlanan</div>
          </div>
          <div style="background:var(--bg3);padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:var(--yellow)">3</div>
            <div style="font-size:11px;color:var(--text3)">Devam Eden</div>
          </div>
          <div style="background:var(--bg3);padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:var(--purple)">250K</div>
            <div style="font-size:11px;color:var(--text3)">Toplam Bütçe</div>
          </div>
        </div>
        
        <h4 style="margin-bottom:15px;color:var(--accent)">Son İşbirlikleri</h4>
        <div style="background:var(--bg3);padding:15px;border-radius:8px">
          <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
            <div style="font-weight:600;margin-bottom:4px">2024 Kurban Organizasyonu</div>
            <div style="font-size:12px;color:var(--text3)">Tamamlandı • 15.07.2024</div>
          </div>
          <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
            <div style="font-weight:600;margin-bottom:4px">Ramazan Yardım Paketi</div>
            <div style="font-size:12px;color:var(--text3)">Tamamlandı • 25.03.2024</div>
          </div>
          <div>
            <div style="font-weight:600;margin-bottom:4px">Su Kuyusu Projesi</div>
            <div style="font-size:12px;color:var(--yellow)">Devam Ediyor • Başlangıç: 10.01.2024</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="form-actions" style="margin-top:20px">
      <button class="btn btn-secondary" onclick="closeModal()">Kapat</button>
      <button class="btn btn-primary" onclick="modalDuzenlePartner(${id})">
        <i class="fa-solid fa-pen"></i> Düzenle
      </button>
    </div>
  `, true, 'handshake');
}

function silPartner(id) {
  if (confirm('Bu partner kurumu silmek istediğinizden emin misiniz?')) {
    toast('Partner silme özelliği geliştiriliyor...', 'info');
  }
}

function filterPartnerler() {
  toast('Filtreleme özelliği geliştiriliyor...', 'info');
}
