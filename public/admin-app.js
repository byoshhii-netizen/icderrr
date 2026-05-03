// ═══════════════════════════════════════════════════════════════════════════
// İÇDER KURBAN - ADMIN PANELİ
// ═══════════════════════════════════════════════════════════════════════════

// ─── STATE ───────────────────────────────────────────────────────────────────
const AdminState = { page: 'dashboard' };

// ─── INIT ────────────────────────────────────────────────────────────────────
(async function init() {
  await loadDashboard();
})();

// ─── API ─────────────────────────────────────────────────────────────────────
async function adminApi(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('/api/admin' + url, opts);
  const d = await r.json();
  if (!r.ok) throw new Error(d.hata || 'Hata oluştu');
  return d;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-xmark'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(title, html, large = false, icon = '') {
  document.getElementById('modal-title').innerHTML = `${icon ? `<i class="fa-solid fa-${icon}"></i>` : ''}${title}`;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-box').className = large ? 'modal modal-lg' : 'modal';
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModalOutside(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

// ─── NAV ─────────────────────────────────────────────────────────────────────
function showAdminPage(page) {
  AdminState.page = page;
  document.querySelectorAll('.sidebar-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page));
  
  if (page === 'dashboard') renderDashboard();
  else if (page === 'sistem-modu') renderSistemModu();
  else if (page === 'organizasyonlar') renderOrganizasyonlar();
  else if (page === 'kurbanlar') renderKurbanlar();
  else if (page === 'bagiscilar') renderBagiscilar();
  else if (page === 'medya') renderMedya();
  else if (page === 'talepler') renderTalepler();
  else if (page === 'sifreler') renderSifreler();
  else if (page === 'kategoriler') renderKategoriler();
  else if (page === 'filtreler') renderFiltreler();
  else if (page === 'giris-logosu') renderGirisLogosu();
  else if (page === 'yazdirma-ayarlari') renderYazdirmaAyarlari();
  else if (page === 'yedek') renderYedek();
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const stats = await adminApi('GET', '/dashboard');
    document.getElementById('talep-badge').textContent = stats.bekleyenTalep;
    document.getElementById('talep-badge').style.display = stats.bekleyenTalep > 0 ? 'inline' : 'none';
  } catch (e) {
    console.error('Dashboard yüklenemedi:', e);
  }
}

async function renderDashboard() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-gauge"></i></div>
        Admin Dashboard
      </div>
    </div>
    <div class="stats-grid" id="admin-stats">
      <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-chart-line"></i> Hızlı İşlemler</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
        <button class="btn btn-primary" onclick="showAdminPage('organizasyonlar')">
          <i class="fa-solid fa-layer-group"></i> Organizasyonları Görüntüle
        </button>
        <button class="btn btn-secondary" onclick="showAdminPage('kurbanlar')">
          <i class="fa-solid fa-cow"></i> Tüm Kurbanları Görüntüle
        </button>
        <button class="btn btn-purple" onclick="showAdminPage('yazdirma-ayarlari')">
          <i class="fa-solid fa-print"></i> Yazdırma Ayarları
        </button>
        <button class="btn btn-success" onclick="showAdminPage('talepler')">
          <i class="fa-solid fa-headset"></i> Destek Talepleri
        </button>
        <button class="btn btn-danger" onclick="showAdminPage('sistem-modu')">
          <i class="fa-solid fa-power-off"></i> Sistem Modu
        </button>
        <button class="btn btn-secondary" onclick="showAdminPage('sifreler')">
          <i class="fa-solid fa-key"></i> Şifre Yönetimi
        </button>
      </div>
    </div>`;
  
  try {
    const stats = await adminApi('GET', '/dashboard');
    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
        <div class="stat-value">${stats.toplamOrg}</div>
        <div class="stat-label">Toplam Organizasyon</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa-solid fa-cow"></i></div>
        <div class="stat-value">${stats.toplamKurban}</div>
        <div class="stat-label">Toplam Kurban</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
        <div class="stat-value">${stats.toplamHisse}</div>
        <div class="stat-label">Toplam Bağışçı</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa-solid fa-headset"></i></div>
        <div class="stat-value">${stats.bekleyenTalep}</div>
        <div class="stat-label">Bekleyen Talep</div>
      </div>`;
  } catch (e) {
    document.getElementById('admin-stats').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>İstatistikler yüklenemedi</p></div>';
  }
}

// ─── SİSTEM MODU ─────────────────────────────────────────────────────────────
async function renderSistemModu() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-power-off"></i></div>
        Sistem Modu
      </div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-gear"></i> Sistem Durumu</div>
      <div id="sistem-modu-icerik">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  
  try {
    const data = await adminApi('GET', '/sistem-modu');
    const modRenk = { acik: 'success', bakim: 'warning', kapali: 'danger' };
    const modIcon = { acik: 'circle-check', bakim: 'wrench', kapali: 'circle-xmark' };
    const modText = { acik: 'Açık', bakim: 'Bakım Modu', kapali: 'Kapalı' };
    
    document.getElementById('sistem-modu-icerik').innerHTML = `
      <div style="margin-bottom:20px">
        <div class="badge badge-${modRenk[data.mod]}" style="font-size:14px;padding:8px 16px">
          <i class="fa-solid fa-${modIcon[data.mod]}"></i> Sistem ${modText[data.mod]}
        </div>
        ${data.not ? `<div style="margin-top:8px;color:var(--text2);font-size:13px">${data.not}</div>` : ''}
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Sistem Modu</label>
          <select id="sistem-mod-select">
            <option value="acik" ${data.mod === 'acik' ? 'selected' : ''}>Açık</option>
            <option value="bakim" ${data.mod === 'bakim' ? 'selected' : ''}>Bakım Modu</option>
            <option value="kapali" ${data.mod === 'kapali' ? 'selected' : ''}>Kapalı</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Sistem Notu (Opsiyonel)</label>
          <textarea id="sistem-not-input" placeholder="Kullanıcılara gösterilecek not...">${data.not || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="sistemModuKaydet()">
          <i class="fa-solid fa-floppy-disk"></i> Kaydet
        </button>
      </div>`;
  } catch (e) {
    document.getElementById('sistem-modu-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Sistem modu yüklenemedi</p></div>';
  }
}

async function sistemModuKaydet() {
  const mod = document.getElementById('sistem-mod-select').value;
  const not = document.getElementById('sistem-not-input').value.trim();
  
  try {
    await adminApi('POST', '/sistem-modu', { mod, not });
    toast('Sistem modu güncellendi');
    renderSistemModu();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ─── ORGANİZASYONLAR ─────────────────────────────────────────────────────────
async function renderOrganizasyonlar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-layer-group"></i></div>
        Tüm Organizasyonlar
      </div>
      <button class="btn btn-primary" onclick="adminYeniOrg()">
        <i class="fa-solid fa-plus"></i> Yeni Organizasyon
      </button>
    </div>
    <div class="card">
      <div class="table-wrap" id="org-table">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  await adminYukleOrg();
}

async function adminYukleOrg() {
  try {
    const list = await adminApi('GET', '/organizasyonlar');
    if (!list.length) {
      document.getElementById('org-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-layer-group"></i><p>Henüz organizasyon yok</p></div>';
      return;
    }
    let html = '<table><thead><tr><th>ID</th><th>Organizasyon Adı</th><th>Yıl</th><th>Maks. Kurban</th><th>Büyükbaş</th><th>Küçükbaş</th><th>Oluşturma</th><th>İşlemler</th></tr></thead><tbody>';
    list.forEach(o => {
      html += `<tr>
        <td>${o.id}</td>
        <td><strong>${o.ad}</strong></td>
        <td>${o.yil}</td>
        <td>${o.max_kurban}</td>
        <td>${o.buyukbas_hisse_fiyati} TL</td>
        <td>${o.kucukbas_hisse_fiyati} TL</td>
        <td>${new Date(o.olusturma).toLocaleDateString('tr-TR')}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="adminDuzenleOrg(${o.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="adminSilOrg(${o.id},'${o.ad.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('org-table').innerHTML = html;
  } catch (e) {
    document.getElementById('org-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Yüklenemedi</p></div>';
  }
}

function adminYeniOrg() {
  openModal('Yeni Organizasyon', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1"><label>Ad *</label><input id="ao-ad" placeholder="Organizasyon adı"/></div>
      <div class="form-group"><label>Yıl *</label><input id="ao-yil" type="number" value="${new Date().getFullYear()}"/></div>
      <div class="form-group"><label>Maks. Kurban *</label><input id="ao-max" type="number" placeholder="100"/></div>
      <div class="form-group"><label>Büyükbaş Hisse (TL)</label><input id="ao-bb" type="number" placeholder="0"/></div>
      <div class="form-group"><label>Küçükbaş Hisse (TL)</label><input id="ao-kb" type="number" placeholder="0"/></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="adminKaydetOrg()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`, false, 'layer-group');
}

async function adminKaydetOrg() {
  const ad = document.getElementById('ao-ad').value.trim();
  const yil = parseInt(document.getElementById('ao-yil').value);
  const max_kurban = parseInt(document.getElementById('ao-max').value);
  const buyukbas_hisse_fiyati = parseFloat(document.getElementById('ao-bb').value)||0;
  const kucukbas_hisse_fiyati = parseFloat(document.getElementById('ao-kb').value)||0;
  if (!ad||!yil||!max_kurban) return toast('Zorunlu alanlar eksik','error');
  try {
    await adminApi('POST', '/org-olustur', {ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati});
    closeModal(); toast('Organizasyon oluşturuldu'); adminYukleOrg();
  } catch(e) { toast(e.message,'error'); }
}

async function adminDuzenleOrg(id) {
  const list = await adminApi('GET', '/organizasyonlar');
  const o = list.find(x=>x.id===id); if (!o) return;
  openModal('Organizasyonu Düzenle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1"><label>Ad *</label><input id="ao-ad" value="${o.ad}"/></div>
      <div class="form-group"><label>Yıl *</label><input id="ao-yil" type="number" value="${o.yil}"/></div>
      <div class="form-group"><label>Maks. Kurban *</label><input id="ao-max" type="number" value="${o.max_kurban}"/></div>
      <div class="form-group"><label>Büyükbaş Hisse (TL)</label><input id="ao-bb" type="number" value="${o.buyukbas_hisse_fiyati}"/></div>
      <div class="form-group"><label>Küçükbaş Hisse (TL)</label><input id="ao-kb" type="number" value="${o.kucukbas_hisse_fiyati}"/></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="adminGuncOrg(${id})"><i class="fa-solid fa-floppy-disk"></i> Güncelle</button>
    </div>`, false, 'pen');
}

async function adminGuncOrg(id) {
  const ad = document.getElementById('ao-ad').value.trim();
  const yil = parseInt(document.getElementById('ao-yil').value);
  const max_kurban = parseInt(document.getElementById('ao-max').value);
  const buyukbas_hisse_fiyati = parseFloat(document.getElementById('ao-bb').value)||0;
  const kucukbas_hisse_fiyati = parseFloat(document.getElementById('ao-kb').value)||0;
  try {
    await adminApi('PUT', '/org-guncelle/' + id, {ad,yil,max_kurban,buyukbas_hisse_fiyati,kucukbas_hisse_fiyati});
    closeModal(); toast('Güncellendi'); adminYukleOrg();
  } catch(e) { toast(e.message,'error'); }
}

async function adminSilOrg(id, ad) {
  if (!confirm('"' + ad + '" organizasyonunu silmek istediğinizden emin misiniz?\nTüm kurbanlar ve hisseler de silinecek!')) return;
  try {
    await adminApi('DELETE', '/org-sil/' + id);
    toast('Organizasyon silindi'); adminYukleOrg();
  } catch(e) { toast(e.message,'error'); }
}

function orgDetay(id) { adminDuzenleOrg(id); }

// ─── KURBANLAR ───────────────────────────────────────────────────────────────
async function renderKurbanlar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-cow"></i></div>
        Tüm Kurbanlar
      </div>
    </div>
    <div class="card">
      <div class="table-wrap" id="kurban-table">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  
  try {
    const list = await adminApi('GET', '/kurbanlar');
    if (!list.length) {
      document.getElementById('kurban-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-cow"></i><p>Henüz kurban yok</p></div>';
      return;
    }
    
    let html = '<table><thead><tr><th>ID</th><th>Organizasyon</th><th>Kurban No</th><th>Tür</th><th>Kupe No</th><th>Alış Fiyatı</th><th>Toplam Hisse</th><th>Kesildi</th><th>Oluşturma</th></tr></thead><tbody>';
    list.forEach(k => {
      html += `<tr>
        <td>${k.id}</td>
        <td>${k.org_ad || 'Bilinmiyor'}</td>
        <td><strong>#${k.kurban_no}</strong></td>
        <td><span class="badge ${k.tur === 'buyukbas' ? 'badge-green' : 'badge-yellow'}">${k.tur === 'buyukbas' ? 'Büyükbaş' : 'Küçükbaş'}</span></td>
        <td>${k.kupe_no || '-'}</td>
        <td>${k.alis_fiyati || 0} TL</td>
        <td>${k.toplam_hisse}</td>
        <td>${k.kesildi ? '<span class="badge badge-red">Kesildi</span>' : '<span class="badge badge-gray">Bekliyor</span>'}</td>
        <td>${new Date(k.olusturma).toLocaleDateString('tr-TR')}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('kurban-table').innerHTML = html;
  } catch (e) {
    document.getElementById('kurban-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Kurbanlar yüklenemedi</p></div>';
  }
}

// ─── MEDYA ───────────────────────────────────────────────────────────────────
async function renderMedya() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-photo-film"></i></div>
        Tüm Medya
      </div>
    </div>
    <div class="card">
      <div id="medya-icerik">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  
  try {
    const list = await adminApi('GET', '/medya');
    if (!list.length) {
      document.getElementById('medya-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-photo-film"></i><p>Henüz medya dosyası yok</p></div>';
      return;
    }
    
    document.getElementById('medya-icerik').innerHTML = `<p>Toplam ${list.length} medya dosyası bulundu.</p>`;
  } catch (e) {
    document.getElementById('medya-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Medya dosyaları yüklenemedi</p></div>';
  }
}

// ─── DESTEK TALEPLERİ ────────────────────────────────────────────────────────
async function renderTalepler() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-headset"></i></div>
        Destek Talepleri
      </div>
    </div>
    <div class="card">
      <div class="table-wrap" id="talep-table">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  await adminYukleTalepler();
}

async function adminYukleTalepler() {
  try {
    const list = await adminApi('GET', '/talepler');
    if (!list.length) {
      document.getElementById('talep-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-headset"></i><p>Henüz destek talebi yok</p></div>';
      return;
    }
    const durumRenk = { bekliyor: 'badge-yellow', inceleniyor: 'badge-blue', cevaplandi: 'badge-green', kapandi: 'badge-gray' };
    const durumText = { bekliyor: 'Bekliyor', inceleniyor: 'İnceleniyor', cevaplandi: 'Cevaplandı', kapandi: 'Kapatıldı' };
    let html = '<table><thead><tr><th>ID</th><th>Başlık</th><th>İçerik</th><th>Durum</th><th>Oluşturma</th><th>İşlemler</th></tr></thead><tbody>';
    list.forEach(t => {
      html += `<tr>
        <td>${t.id}</td>
        <td><strong>${t.baslik}</strong></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.icerik}</td>
        <td><span class="badge ${durumRenk[t.durum]||'badge-gray'}">${durumText[t.durum]||t.durum}</span></td>
        <td>${new Date(t.olusturma).toLocaleDateString('tr-TR')}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-primary btn-sm" onclick="adminCevapla(${t.id})"><i class="fa-solid fa-reply"></i> Cevapla</button>
          <button class="btn btn-danger btn-sm" onclick="adminSilTalep(${t.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('talep-table').innerHTML = html;
  } catch (e) {
    document.getElementById('talep-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Talepler yüklenemedi</p></div>';
  }
}

function adminCevapla(id) {
  openModal('Talebe Cevap Ver', `
    <div class="form-group">
      <label>Durum</label>
      <select id="talep-durum">
        <option value="inceleniyor">İnceleniyor</option>
        <option value="cevaplandi">Cevaplandı</option>
        <option value="kapandi">Kapatıldı</option>
      </select>
    </div>
    <div class="form-group" style="margin-top:12px">
      <label>Cevap *</label>
      <textarea id="talep-cevap" rows="4" placeholder="Kullanıcıya cevabınızı yazın..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="adminGonderCevap(${id})"><i class="fa-solid fa-paper-plane"></i> Gönder</button>
    </div>`, false, 'reply');
}

async function adminGonderCevap(id) {
  const cevap = document.getElementById('talep-cevap').value.trim();
  if (!cevap) return toast('Cevap boş olamaz', 'error');
  try {
    await adminApi('POST', '/talep-cevapla', { id, cevap });
    closeModal(); toast('Cevap gönderildi'); adminYukleTalepler();
  } catch(e) { toast(e.message, 'error'); }
}

async function adminSilTalep(id) {
  if (!confirm('Bu talebi silmek istediğinizden emin misiniz?')) return;
  try {
    await adminApi('DELETE', '/talep-sil', { id });
    toast('Talep silindi'); adminYukleTalepler();
  } catch(e) { toast(e.message, 'error'); }
}

function talepDetay(id) { adminCevapla(id); }

// ─── ŞİFRE YÖNETİMİ ──────────────────────────────────────────────────────────
async function renderSifreler() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-key"></i></div>
        Şifre Yönetimi
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-shield-halved"></i> Admin Şifresi</div>
        <div class="form-group">
          <label>Yeni Admin Şifresi</label>
          <input id="admin-sifre-input" type="password" placeholder="Yeni şifre girin"/>
        </div>
        <div class="form-actions">
          <button class="btn btn-danger" onclick="sifreDegistir('admin')">
            <i class="fa-solid fa-key"></i> Admin Şifresini Değiştir
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-user"></i> İÇDER Şifresi</div>
        <div class="form-group">
          <label>Yeni İÇDER Şifresi</label>
          <input id="icder-sifre-input" type="password" placeholder="Yeni şifre girin"/>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="sifreDegistir('icder')">
            <i class="fa-solid fa-key"></i> İÇDER Şifresini Değiştir
          </button>
        </div>
      </div>
    </div>`;
}

async function sifreDegistir(tur) {
  const input = document.getElementById(tur + '-sifre-input');
  const yeniSifre = input.value.trim();
  
  if (!yeniSifre) {
    toast('Lütfen yeni şifre girin', 'error');
    return;
  }
  
  if (yeniSifre.length < 4) {
    toast('Şifre en az 4 karakter olmalı', 'error');
    return;
  }
  
  try {
    await adminApi('POST', '/sifre-degistir', { tur, yeni_sifre: yeniSifre });
    toast(`${tur === 'admin' ? 'Admin' : 'İÇDER'} şifresi başarıyla değiştirildi`);
    input.value = '';
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ─── YAZDIRMA AYARLARI ───────────────────────────────────────────────────────
async function renderYazdirmaAyarlari() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-print"></i></div>
        Yazdırma Ayarları Yönetimi
      </div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-image"></i> Tüm Kullanıcıların Yazdırma Ayarları</div>
      <div id="yazdirma-ayarlari-icerik">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  
  try {
    // Tüm kullanıcıların yazdırma ayarlarını getir
    const ayarlar = await adminApi('GET', '/yazdirma-ayarlari');
    
    if (!ayarlar.length) {
      document.getElementById('yazdirma-ayarlari-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-print"></i><p>Henüz yazdırma ayarı yok</p></div>';
      return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">';
    ayarlar.forEach(ayar => {
      html += `
        <div class="card" style="margin:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h4>Kullanıcı ID: ${ayar.kullanici_id}</h4>
            <button class="btn btn-danger btn-sm" onclick="yazdirmaAyarSil(${ayar.kullanici_id})">
              <i class="fa-solid fa-trash"></i> Sil
            </button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:12px;color:var(--text3)">Logo</label>
              <div style="border:1px solid var(--border);border-radius:8px;padding:8px;min-height:60px;display:flex;align-items:center;justify-content:center">
                ${ayar.logo_data ? '<img src="' + ayar.logo_data + '" style="max-height:50px;max-width:100%;object-fit:contain"/>' : '<span style="color:var(--text3);font-size:12px">Logo yok</span>'}
              </div>
            </div>
            <div>
              <label style="font-size:12px;color:var(--text3)">Bayrak</label>
              <div style="border:1px solid var(--border);border-radius:8px;padding:8px;min-height:60px;display:flex;align-items:center;justify-content:center">
                ${ayar.bayrak_data ? '<img src="' + ayar.bayrak_data + '" style="max-height:50px;max-width:100%;object-fit:contain"/>' : '<span style="color:var(--text3);font-size:12px">Bayrak yok</span>'}
              </div>
            </div>
          </div>
          <div style="margin-top:12px;font-size:12px;color:var(--text3)">
            Kurulum: ${ayar.kurulum_tamamlandi ? 'Tamamlandı' : 'Tamamlanmadı'}
          </div>
        </div>`;
    });
    html += '</div>';
    
    document.getElementById('yazdirma-ayarlari-icerik').innerHTML = html;
  } catch (e) {
    document.getElementById('yazdirma-ayarlari-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Yazdırma ayarları yüklenemedi</p></div>';
  }
}

async function yazdirmaAyarSil(kullaniciId) {
  if (!confirm('Bu kullanıcının yazdırma ayarlarını silmek istediğinizden emin misiniz?')) return;
  
  try {
    await adminApi('DELETE', '/yazdirma-ayar-sil', { kullanici_id: kullaniciId });
    toast('Yazdırma ayarları silindi');
    renderYazdirmaAyarlari();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ─── ÇIKIŞ ───────────────────────────────────────────────────────────────────
async function adminCikis() {
  if (!confirm('Admin panelinden çıkmak istediğinizden emin misiniz?')) return;
  
  try {
    await adminApi('POST', '/cikis');
    window.location.href = '/admin-giris';
  } catch (e) {
    window.location.href = '/admin-giris';
  }
}

// Sayfa yüklenince dashboard'u göster
window.addEventListener('load', function() {
  showAdminPage('dashboard');
});

// ─── BAĞIŞÇILAR ──────────────────────────────────────────────────────────────
async function renderBagiscilar() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-users"></i></div>
        Tüm Bağışçılar
      </div>
    </div>
    <div class="card">
      <div class="filter-bar" style="margin-bottom:12px">
        <input id="bagisci-ara" placeholder="Bağışçı adı ara..." oninput="adminBagisciFiltrele()" style="min-width:220px"/>
      </div>
      <div class="table-wrap" id="bagisci-table">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  await adminYukleBagiscilar();
}

let _adminBagiscilar = [];
async function adminYukleBagiscilar() {
  try {
    _adminBagiscilar = await adminApi('GET', '/bagiscilar');
    adminBagisciFiltrele();
  } catch(e) {
    document.getElementById('bagisci-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Yüklenemedi</p></div>';
  }
}

function adminBagisciFiltrele() {
  const q = (document.getElementById('bagisci-ara')?.value || '').toLowerCase();
  const list = q ? _adminBagiscilar.filter(b => (b.bagisci_adi||'').toLowerCase().includes(q) || (b.bagisci_telefon||'').includes(q)) : _adminBagiscilar;
  const el = document.getElementById('bagisci-table');
  if (!el) return;
  if (!list.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users"></i><p>Bağışçı bulunamadı</p></div>'; return; }
  let html = '<table><thead><tr><th>#</th><th>Bağışçı</th><th>Telefon</th><th>Kimin Adına</th><th>Organizasyon</th><th>Kurban</th><th>Ödeme</th><th>Video</th><th>İşlemler</th></tr></thead><tbody>';
  list.forEach((b, i) => {
    html += `<tr>
      <td>${i+1}</td>
      <td><strong>${b.bagisci_adi||'-'}</strong></td>
      <td>${b.bagisci_telefon||'-'}</td>
      <td>${b.kimin_adina||'-'}</td>
      <td style="font-size:12px;color:var(--text3)">${b.org_ad||'-'}</td>
      <td>#${b.kurban_no} <span class="badge ${b.tur==='buyukbas'?'badge-green':'badge-yellow'}">${b.tur==='buyukbas'?'BB':'KB'}</span></td>
      <td><span class="badge ${b.odeme_durumu==='odendi'?'badge-green':b.odeme_durumu==='iptal'?'badge-red':'badge-yellow'}">${b.odeme_durumu==='odendi'?'Ödendi':b.odeme_durumu==='iptal'?'İptal':'Bekliyor'}</span></td>
      <td>${b.video_ister?'<span class="badge badge-blue">Evet</span>':'Hayır'}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-secondary btn-sm" onclick="adminBagisciDuzenle(${b.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="adminBagisciSil(${b.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function adminBagisciDuzenle(id) {
  const b = _adminBagiscilar.find(x => x.id === id);
  if (!b) return;
  openModal('Bağışçı Düzenle', `
    <div class="form-grid">
      <div class="form-group"><label>Bağışçı Adı *</label><input id="ab-ad" value="${b.bagisci_adi||''}"/></div>
      <div class="form-group"><label>Telefon</label><input id="ab-tel" value="${b.bagisci_telefon||''}"/></div>
      <div class="form-group"><label>Kimin Adına</label><input id="ab-adina" value="${b.kimin_adina||''}"/></div>
      <div class="form-group"><label>Adına Tel</label><input id="ab-adina-tel" value="${b.kimin_adina_telefon||''}"/></div>
      <div class="form-group"><label>Ödeme Durumu</label>
        <select id="ab-odeme">
          <option value="bekliyor" ${b.odeme_durumu==='bekliyor'?'selected':''}>Bekliyor</option>
          <option value="odendi" ${b.odeme_durumu==='odendi'?'selected':''}>Ödendi</option>
          <option value="iptal" ${b.odeme_durumu==='iptal'?'selected':''}>İptal</option>
        </select>
      </div>
      <div class="form-group"><label>Video İster mi?</label>
        <select id="ab-video">
          <option value="0" ${!b.video_ister?'selected':''}>Hayır</option>
          <option value="1" ${b.video_ister?'selected':''}>Evet</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="adminBagisciKaydet(${id})"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`, false, 'pen');
}

async function adminBagisciKaydet(id) {
  const data = {
    bagisci_adi: document.getElementById('ab-ad').value.trim(),
    bagisci_telefon: document.getElementById('ab-tel').value.trim(),
    kimin_adina: document.getElementById('ab-adina').value.trim(),
    kimin_adina_telefon: document.getElementById('ab-adina-tel').value.trim(),
    odeme_durumu: document.getElementById('ab-odeme').value,
    video_ister: parseInt(document.getElementById('ab-video').value)
  };
  if (!data.bagisci_adi) return toast('Bağışçı adı zorunlu', 'error');
  try {
    await adminApi('PUT', '/bagisci-guncelle/' + id, data);
    closeModal(); toast('Bağışçı güncellendi'); adminYukleBagiscilar();
  } catch(e) { toast(e.message, 'error'); }
}

async function adminBagisciSil(id) {
  if (!confirm('Bu bağışçıyı silmek istediğinizden emin misiniz? (Hisse boşaltılacak)')) return;
  try {
    await adminApi('DELETE', '/bagisci-sil/' + id);
    toast('Bağışçı silindi'); adminYukleBagiscilar();
  } catch(e) { toast(e.message, 'error'); }
}

// ─── YEDEK ───────────────────────────────────────────────────────────────────
async function renderYedek() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-database"></i></div>
        Yedek Yönetimi
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-download"></i> Manuel Yedek Al</div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:16px">Tüm organizasyon, kurban, bağışçı ve ayar verilerini JSON olarak indirin.</p>
        <button class="btn btn-success" onclick="adminYedekAl()">
          <i class="fa-solid fa-download"></i> Yedek İndir (JSON)
        </button>
      </div>
      <div class="card">
        <div class="card-title"><i class="fa-solid fa-upload"></i> Yedek Yükle</div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:16px">Daha önce alınan JSON yedeği geri yükleyin. Mevcut veriler korunur, eksik olanlar eklenir.</p>
        <input type="file" id="yedek-dosya-input" accept=".json" style="display:none" onchange="adminYedekYukle(this)"/>
        <button class="btn btn-primary" onclick="document.getElementById('yedek-dosya-input').click()">
          <i class="fa-solid fa-upload"></i> Yedek Dosyası Seç
        </button>
        <div id="yedek-yukle-sonuc" style="margin-top:10px;font-size:12px;color:var(--text3)"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Otomatik Yedekler
        <span style="font-size:12px;font-weight:400;color:var(--text3);margin-left:8px">Her 10 dakikada bir otomatik alınır • Son 20 yedek saklanır</span>
        <button class="btn btn-sm" onclick="adminOtoYedekListeYenile()" style="margin-left:auto;padding:4px 10px;font-size:12px">
          <i class="fa-solid fa-rotate"></i> Yenile
        </button>
      </div>
      <div id="oto-yedek-liste" style="margin-top:12px">
        <div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">Yükleniyor...</div>
      </div>
    </div>`;

  adminOtoYedekListeYenile();
}

async function adminOtoYedekListeYenile() {
  const el = document.getElementById('oto-yedek-liste');
  if (!el) return;
  try {
    if (!window.electronAPI) {
      el.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">Otomatik yedekler sadece masaüstü uygulamada görüntülenebilir.</div>';
      return;
    }
    const { dosyalar, dir } = await window.electronAPI.listAutoBackups();
    if (!dosyalar || dosyalar.length === 0) {
      el.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px"><i class="fa-solid fa-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>Henüz otomatik yedek yok.<br><small>Program açık kaldıkça her 10 dakikada bir yedek alınır.</small></div>';
      return;
    }
    el.innerHTML = `
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">Klasör: ${dir}</div>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:8px 6px;color:var(--text2)">Dosya Adı</th>
            <th style="text-align:left;padding:8px 6px;color:var(--text2)">Tarih</th>
            <th style="text-align:right;padding:8px 6px;color:var(--text2)">Boyut</th>
            <th style="text-align:center;padding:8px 6px;color:var(--text2)">İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${dosyalar.map((d, i) => `
            <tr style="border-bottom:1px solid var(--border);${i===0?'background:rgba(16,185,129,0.05)':''}">
              <td style="padding:8px 6px;font-family:monospace;font-size:12px">${d.filename}${i===0?' <span style="background:#10b981;color:#fff;font-size:10px;padding:1px 5px;border-radius:4px;font-family:sans-serif">Son</span>':''}</td>
              <td style="padding:8px 6px;color:var(--text2)">${new Date(d.mtime).toLocaleString('tr-TR')}</td>
              <td style="padding:8px 6px;text-align:right;color:var(--text3)">${(d.size/1024).toFixed(1)} KB</td>
              <td style="padding:8px 6px;text-align:center">
                <button onclick="adminOtoYedekIndir('${d.filename}')" style="background:var(--primary);color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-right:4px" title="İndir">
                  <i class="fa-solid fa-download"></i>
                </button>
                <button onclick="adminOtoYedekYukle('${d.filename}')" style="background:#f59e0b;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-right:4px" title="Bu yedeği geri yükle">
                  <i class="fa-solid fa-rotate-left"></i>
                </button>
                <button onclick="adminOtoYedekSil('${d.filename}')" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px" title="Sil">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:#ef4444;font-size:13px;padding:12px">Hata: ${e.message}</div>`;
  }
}

async function adminOtoYedekIndir(filename) {
  if (!window.electronAPI) return;
  const r = await window.electronAPI.downloadAutoBackup(filename);
  if (r.ok) toast('Yedek kaydedildi: ' + r.path);
  else if (!r.canceled) toast(r.error || 'İndirilemedi', 'error');
}

async function adminOtoYedekYukle(filename) {
  if (!window.electronAPI) return;
  if (!confirm(`"${filename}" yedeği geri yüklensin mi?\n\nMevcut veriler korunur, eksik olanlar eklenir.`)) return;
  try {
    // Dosyayı oku
    const { dosyalar } = await window.electronAPI.listAutoBackups();
    const dosya = dosyalar.find(d => d.filename === filename);
    if (!dosya) { toast('Dosya bulunamadı', 'error'); return; }
    
    // Electron'dan dosya içeriğini al ve API'ye gönder
    toast('Yedek yükleniyor...');
    const r = await fetch('/api/admin/oto-yedek-yukle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    const d = await r.json();
    if (!r.ok) { toast(d.hata || 'Yüklenemedi', 'error'); return; }
    toast(`Yedek yüklendi: ${d.yuklenenOrg} org, ${d.yuklenenKurban} kurban, ${d.yuklenenHisse} hisse eklendi`);
  } catch(e) { toast(e.message, 'error'); }
}

async function adminOtoYedekSil(filename) {
  if (!window.electronAPI) return;
  if (!confirm(`"${filename}" silinsin mi?`)) return;
  const r = await window.electronAPI.deleteAutoBackup(filename);
  if (r.ok) { toast('Silindi'); adminOtoYedekListeYenile(); }
  else toast(r.error || 'Silinemedi', 'error');

async function adminYedekAl() {
  try {
    toast('Yedek hazırlanıyor...');
    const r = await fetch('/api/admin/yedek-al', { headers: { 'Content-Type': 'application/json' } });
    if (!r.ok) { toast('Yedek alınamadı', 'error'); return; }
    const blob = await r.blob();
    const tarih = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'icder-yedek-' + tarih + '.json';
    a.click();
    toast('Yedek indirildi');
  } catch(e) { toast(e.message, 'error'); }
}

async function adminYedekYukle(input) {
  const file = input.files[0];
  if (!file) return;
  const sonucEl = document.getElementById('yedek-yukle-sonuc');
  if (sonucEl) sonucEl.textContent = 'Yükleniyor...';
  try {
    const formData = new FormData();
    formData.append('yedek', file);
    const r = await fetch('/api/admin/yedek-yukle-dosya', { method: 'POST', body: formData });
    const d = await r.json();
    if (!r.ok) { 
      toast(d.hata || 'Yüklenemedi', 'error');
      if (sonucEl) sonucEl.textContent = 'Hata: ' + (d.hata || 'Yüklenemedi');
      return;
    }
    toast(`Yedek yüklendi: ${d.yuklenenOrg} org, ${d.yuklenenKurban} kurban, ${d.yuklenenHisse} hisse eklendi`);
    if (sonucEl) sonucEl.innerHTML = `<span style="color:#10b981">✓ ${d.yuklenenOrg} organizasyon, ${d.yuklenenKurban} kurban, ${d.yuklenenHisse} hisse eklendi</span>`;
    input.value = '';
  } catch(e) { 
    toast(e.message, 'error');
    if (sonucEl) sonucEl.textContent = 'Hata: ' + e.message;
  }
}

async function adminOtomatikYedekKaydet() {
  // Artık kullanılmıyor - otomatik yedek her 10 dk'da bir çalışıyor
  toast('Otomatik yedek her 10 dakikada bir otomatik alınıyor', 'info');
}
  const silSonuc = await window.electronAPI.deleteAutoBackup(filename);
  if (silSonuc.ok) { toast('Silindi'); adminOtoYedekListeYenile(); }
  else toast(silSonuc.error || 'Silinemedi', 'error');
}


// ═══════════════════════════════════════════════════════════════════════════
// KATEGORİ YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════
async function renderKategoriler() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-tags"></i></div>
        Kategori Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniKategori()">
        <i class="fa-solid fa-plus"></i> Yeni Kategori
      </button>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-list"></i> Özel Kategoriler</div>
      <div class="table-wrap" id="kategori-table">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  await yukleKategoriler();
}

async function yukleKategoriler() {
  try {
    const list = await adminApi('GET', '/kategoriler');
    const el = document.getElementById('kategori-table');
    if (!el) return;
    
    if (!list.length) {
      el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-tags"></i><p>Henüz özel kategori yok. Varsayılan kategoriler kullanılıyor.</p></div>';
      return;
    }
    
    let html = '<table><thead><tr><th>ID</th><th>Kategori Adı</th><th>Tip</th><th>Durum</th><th>Oluşturma</th><th>İşlemler</th></tr></thead><tbody>';
    list.forEach(k => {
      html += `<tr>
        <td>${k.id}</td>
        <td><strong>${k.kategori_adi}</strong></td>
        <td><span class="badge badge-blue">${k.kategori_tipi === 'bagisci' ? 'Bağışçı' : k.kategori_tipi}</span></td>
        <td><span class="badge ${k.aktif ? 'badge-green' : 'badge-gray'}">${k.aktif ? 'Aktif' : 'Pasif'}</span></td>
        <td>${new Date(k.olusturma).toLocaleDateString('tr-TR')}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="modalDuzenleKategori(${k.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="silKategori(${k.id},'${k.kategori_adi.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  } catch (e) {
    document.getElementById('kategori-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Kategoriler yüklenemedi</p></div>';
  }
}

function modalYeniKategori() {
  openModal('Yeni Kategori Ekle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Kategori Adı *</label>
        <input id="kat-ad" placeholder="Örn: Premium Bağışçı"/>
      </div>
      <div class="form-group">
        <label>Kategori Tipi</label>
        <select id="kat-tip">
          <option value="bagisci">Bağışçı</option>
          <option value="kurban">Kurban</option>
          <option value="genel">Genel</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="kaydetKategori()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`, false, 'tags');
}

async function kaydetKategori() {
  const kategori_adi = document.getElementById('kat-ad').value.trim();
  const kategori_tipi = document.getElementById('kat-tip').value;
  
  if (!kategori_adi) return toast('Kategori adı gerekli', 'error');
  
  try {
    await adminApi('POST', '/kategori-ekle', { kategori_adi, kategori_tipi });
    closeModal();
    toast('Kategori eklendi');
    yukleKategoriler();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function modalDuzenleKategori(id) {
  const list = await adminApi('GET', '/kategoriler');
  const k = list.find(x => x.id === id);
  if (!k) return;
  
  openModal('Kategori Düzenle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Kategori Adı *</label>
        <input id="kat-ad" value="${k.kategori_adi}"/>
      </div>
      <div class="form-group">
        <label>Kategori Tipi</label>
        <select id="kat-tip">
          <option value="bagisci" ${k.kategori_tipi === 'bagisci' ? 'selected' : ''}>Bağışçı</option>
          <option value="kurban" ${k.kategori_tipi === 'kurban' ? 'selected' : ''}>Kurban</option>
          <option value="genel" ${k.kategori_tipi === 'genel' ? 'selected' : ''}>Genel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Durum</label>
        <select id="kat-aktif">
          <option value="1" ${k.aktif ? 'selected' : ''}>Aktif</option>
          <option value="0" ${!k.aktif ? 'selected' : ''}>Pasif</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="guncelleKategori(${id})"><i class="fa-solid fa-floppy-disk"></i> Güncelle</button>
    </div>`, false, 'pen');
}

async function guncelleKategori(id) {
  const kategori_adi = document.getElementById('kat-ad').value.trim();
  const kategori_tipi = document.getElementById('kat-tip').value;
  const aktif = parseInt(document.getElementById('kat-aktif').value);
  
  if (!kategori_adi) return toast('Kategori adı gerekli', 'error');
  
  try {
    await adminApi('PUT', '/kategori-guncelle/' + id, { kategori_adi, kategori_tipi, aktif });
    closeModal();
    toast('Kategori güncellendi');
    yukleKategoriler();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function silKategori(id, ad) {
  if (!confirm(`"${ad}" kategorisini silmek istediğinizden emin misiniz?`)) return;
  
  try {
    await adminApi('DELETE', '/kategori-sil/' + id);
    toast('Kategori silindi');
    yukleKategoriler();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FİLTRE YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════
async function renderFiltreler() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-filter"></i></div>
        Filtre Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniFiltre()">
        <i class="fa-solid fa-plus"></i> Yeni Filtre
      </button>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-sliders"></i> Özel Filtreler</div>
      <div class="table-wrap" id="filtre-table">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  await yukleFiltreler();
}

async function yukleFiltreler() {
  try {
    const list = await adminApi('GET', '/filtreler');
    const el = document.getElementById('filtre-table');
    if (!el) return;
    
    if (!list.length) {
      el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-filter"></i><p>Henüz özel filtre yok. Varsayılan filtreler kullanılıyor.</p></div>';
      return;
    }
    
    let html = '<table><thead><tr><th>ID</th><th>Filtre Adı</th><th>Tip</th><th>Değer</th><th>Durum</th><th>Oluşturma</th><th>İşlemler</th></tr></thead><tbody>';
    list.forEach(f => {
      html += `<tr>
        <td>${f.id}</td>
        <td><strong>${f.filtre_adi}</strong></td>
        <td><span class="badge badge-purple">${f.filtre_tipi}</span></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${f.filtre_degeri || '-'}</td>
        <td><span class="badge ${f.aktif ? 'badge-green' : 'badge-gray'}">${f.aktif ? 'Aktif' : 'Pasif'}</span></td>
        <td>${new Date(f.olusturma).toLocaleDateString('tr-TR')}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="modalDuzenleFiltre(${f.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="silFiltre(${f.id},'${f.filtre_adi.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  } catch (e) {
    document.getElementById('filtre-table').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Filtreler yüklenemedi</p></div>';
  }
}

function modalYeniFiltre() {
  openModal('Yeni Filtre Ekle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Filtre Adı *</label>
        <input id="fil-ad" placeholder="Örn: Yüksek Bağış"/>
      </div>
      <div class="form-group">
        <label>Filtre Tipi *</label>
        <select id="fil-tip">
          <option value="bagisci">Bağışçı</option>
          <option value="kurban">Kurban</option>
          <option value="odeme">Ödeme</option>
          <option value="video">Video</option>
          <option value="genel">Genel</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Filtre Değeri (Opsiyonel)</label>
        <input id="fil-deger" placeholder="Filtre için özel değer"/>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="kaydetFiltre()"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button>
    </div>`, false, 'filter');
}

async function kaydetFiltre() {
  const filtre_adi = document.getElementById('fil-ad').value.trim();
  const filtre_tipi = document.getElementById('fil-tip').value;
  const filtre_degeri = document.getElementById('fil-deger').value.trim();
  
  if (!filtre_adi || !filtre_tipi) return toast('Filtre adı ve tipi gerekli', 'error');
  
  try {
    await adminApi('POST', '/filtre-ekle', { filtre_adi, filtre_tipi, filtre_degeri });
    closeModal();
    toast('Filtre eklendi');
    yukleFiltreler();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function modalDuzenleFiltre(id) {
  const list = await adminApi('GET', '/filtreler');
  const f = list.find(x => x.id === id);
  if (!f) return;
  
  openModal('Filtre Düzenle', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Filtre Adı *</label>
        <input id="fil-ad" value="${f.filtre_adi}"/>
      </div>
      <div class="form-group">
        <label>Filtre Tipi *</label>
        <select id="fil-tip">
          <option value="bagisci" ${f.filtre_tipi === 'bagisci' ? 'selected' : ''}>Bağışçı</option>
          <option value="kurban" ${f.filtre_tipi === 'kurban' ? 'selected' : ''}>Kurban</option>
          <option value="odeme" ${f.filtre_tipi === 'odeme' ? 'selected' : ''}>Ödeme</option>
          <option value="video" ${f.filtre_tipi === 'video' ? 'selected' : ''}>Video</option>
          <option value="genel" ${f.filtre_tipi === 'genel' ? 'selected' : ''}>Genel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Durum</label>
        <select id="fil-aktif">
          <option value="1" ${f.aktif ? 'selected' : ''}>Aktif</option>
          <option value="0" ${!f.aktif ? 'selected' : ''}>Pasif</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Filtre Değeri</label>
        <input id="fil-deger" value="${f.filtre_degeri || ''}"/>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="guncelleFiltre(${id})"><i class="fa-solid fa-floppy-disk"></i> Güncelle</button>
    </div>`, false, 'pen');
}

async function guncelleFiltre(id) {
  const filtre_adi = document.getElementById('fil-ad').value.trim();
  const filtre_tipi = document.getElementById('fil-tip').value;
  const filtre_degeri = document.getElementById('fil-deger').value.trim();
  const aktif = parseInt(document.getElementById('fil-aktif').value);
  
  if (!filtre_adi || !filtre_tipi) return toast('Filtre adı ve tipi gerekli', 'error');
  
  try {
    await adminApi('PUT', '/filtre-guncelle/' + id, { filtre_adi, filtre_tipi, filtre_degeri, aktif });
    closeModal();
    toast('Filtre güncellendi');
    yukleFiltreler();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function silFiltre(id, ad) {
  if (!confirm(`"${ad}" filtresini silmek istediğinizden emin misiniz?`)) return;
  
  try {
    await adminApi('DELETE', '/filtre-sil/' + id);
    toast('Filtre silindi');
    yukleFiltreler();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GİRİŞ LOGOSU YÖNETİMİ
// ═══════════════════════════════════════════════════════════════════════════
let _girisLogoData = null;

async function renderGirisLogosu() {
  const m = document.getElementById('main-content');
  m.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <div class="icon-wrap"><i class="fa-solid fa-image"></i></div>
        Giriş Logosu Yönetimi
      </div>
      <button class="btn btn-primary" onclick="modalYeniGirisLogosu()">
        <i class="fa-solid fa-plus"></i> Yeni Logo Ekle
      </button>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-image"></i> Aktif Logo</div>
      <div id="aktif-logo-icerik">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-images"></i> Tüm Logolar</div>
      <div id="tum-logolar-icerik">
        <div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Yükleniyor...</p></div>
      </div>
    </div>`;
  await yukleGirisLogolari();
}

async function yukleGirisLogolari() {
  try {
    // Aktif logoyu göster
    const aktifLogo = await adminApi('GET', '/giris-logosu');
    const aktifEl = document.getElementById('aktif-logo-icerik');
    if (aktifEl) {
      if (aktifLogo && aktifLogo.logo_data) {
        aktifEl.innerHTML = `
          <div style="text-align:center;padding:20px">
            <img src="${aktifLogo.logo_data}" style="max-height:200px;max-width:100%;object-fit:contain;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"/>
            <div style="margin-top:12px;color:var(--text3);font-size:13px">Giriş sayfasında gösterilen logo</div>
          </div>`;
      } else {
        aktifEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-image"></i><p>Aktif logo yok. Varsayılan logo kullanılıyor.</p></div>';
      }
    }
    
    // Tüm logoları listele
    const list = await adminApi('GET', '/giris-logolari');
    const tumEl = document.getElementById('tum-logolar-icerik');
    if (!tumEl) return;
    
    if (!list.length) {
      tumEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-images"></i><p>Henüz logo yüklenmemiş.</p></div>';
      return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px">';
    list.forEach(logo => {
      html += `
        <div class="card" style="margin:0;${logo.aktif ? 'border:2px solid var(--accent)' : ''}">
          <div style="text-align:center;padding:12px;background:var(--bg4);border-radius:8px 8px 0 0">
            <img src="${logo.logo_data}" style="max-height:120px;max-width:100%;object-fit:contain"/>
          </div>
          <div style="padding:12px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="badge ${logo.aktif ? 'badge-green' : 'badge-gray'}">${logo.aktif ? 'Aktif' : 'Pasif'}</span>
              <span style="font-size:11px;color:var(--text3)">ID: ${logo.id}</span>
            </div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:12px">
              ${new Date(logo.olusturma).toLocaleDateString('tr-TR')}
            </div>
            <div style="display:flex;gap:6px">
              ${!logo.aktif ? `<button class="btn btn-success btn-sm" onclick="aktifYapGirisLogosu(${logo.id})" style="flex:1"><i class="fa-solid fa-check"></i> Aktif Yap</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="silGirisLogosu(${logo.id})" style="flex:1"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
    tumEl.innerHTML = html;
  } catch (e) {
    document.getElementById('tum-logolar-icerik').innerHTML = '<div class="empty-state"><i class="fa-solid fa-exclamation-triangle"></i><p>Logolar yüklenemedi</p></div>';
  }
}

function modalYeniGirisLogosu() {
  _girisLogoData = null;
  openModal('Yeni Giriş Logosu Ekle', `
    <div class="form-group">
      <label>Logo Görseli *</label>
      <div class="upload-zone" style="padding:40px;text-align:center;cursor:pointer;min-height:150px;display:flex;align-items:center;justify-content:center;border:2px dashed var(--border);border-radius:8px" onclick="document.getElementById('giris-logo-input').click()">
        <div id="giris-logo-preview">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size:32px;color:var(--text3)"></i>
          <div style="color:var(--text3);font-size:14px;margin-top:8px">Logo yüklemek için tıklayın</div>
          <div style="color:var(--text3);font-size:11px;margin-top:4px">PNG, JPG, SVG (Max 2MB)</div>
        </div>
      </div>
      <input type="file" id="giris-logo-input" accept="image/*" style="display:none" onchange="onGirisLogoChange(this)"/>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn btn-primary" onclick="kaydetGirisLogosu()"><i class="fa-solid fa-floppy-disk"></i> Kaydet ve Aktif Yap</button>
    </div>`, false, 'image');
}

function onGirisLogoChange(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    toast('Logo boyutu 2MB\'dan küçük olmalı', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    _girisLogoData = e.target.result;
    document.getElementById('giris-logo-preview').innerHTML = 
      '<img src="' + _girisLogoData + '" style="max-height:140px;max-width:100%;border-radius:6px;object-fit:contain"/>';
  };
  reader.readAsDataURL(file);
}

async function kaydetGirisLogosu() {
  if (!_girisLogoData) return toast('Lütfen logo yükleyin', 'error');
  
  try {
    await adminApi('POST', '/giris-logosu-ekle', { logo_data: _girisLogoData });
    closeModal();
    toast('Logo eklendi ve aktif yapıldı');
    yukleGirisLogolari();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function aktifYapGirisLogosu(id) {
  try {
    await adminApi('PUT', '/giris-logosu-guncelle/' + id, { aktif: true });
    toast('Logo aktif yapıldı');
    yukleGirisLogolari();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function silGirisLogosu(id) {
  if (!confirm('Bu logoyu silmek istediğinizden emin misiniz?')) return;
  
  try {
    await adminApi('DELETE', '/giris-logosu-sil/' + id);
    toast('Logo silindi');
    yukleGirisLogolari();
  } catch (e) {
    toast(e.message, 'error');
  }
}
