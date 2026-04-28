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
  else if (page === 'medya') renderMedya();
  else if (page === 'talepler') renderTalepler();
  else if (page === 'sifreler') renderSifreler();
  else if (page === 'yazdirma-ayarlari') renderYazdirmaAyarlari();
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