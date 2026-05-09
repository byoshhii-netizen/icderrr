/* ============================================
   İÇDER YÖNETİCİ PANELİ - JAVASCRIPT
   ============================================ */

const ADMIN_PASSWORD = 'icder2026';
let currentPage = 'dashboard';
let allBagislar = [];
let allKullanicilar = [];
let mediaFiles = [];

// ============================================
// AUTHENTICATION
// ============================================
function handleLogin(event) {
  event.preventDefault();
  const password = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('loginError');
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('icder_admin_auth', '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    initPanel();
  } else {
    errorEl.textContent = 'Yanlış şifre!';
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 3000);
  }
}

function handleLogout() {
  sessionStorage.removeItem('icder_admin_auth');
  location.reload();
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('icder_admin_auth') === '1') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    initPanel();
  }
});

async function initPanel() {
  await loadData();
  navigateTo('dashboard');
}

async function loadData() {
  allBagislar = await BagisDB.hepsiniGetir() || [];
  allKullanicilar = await BagisDB.kullanicilariGetir() || [];
  updateBadges();
}

function updateBadges() {
  const kurbanlar = allBagislar.filter(b => 
    (b.tur || '').includes('Kurban') || (b.baslik || '').includes('Kurban')
  );
  const bekleyen = kurbanlar.filter(b => b.durum === 'bekliyor').length;
  
  document.getElementById('bagisCount').textContent = allBagislar.length;
  document.getElementById('kurbanCount').textContent = bekleyen;
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
  currentPage = page;
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[onclick="navigateTo('${page}')"]`)?.classList.add('active');
  
  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    bagislar: 'Bağışlar',
    kurbanlar: 'Kurban Yönetimi',
    kullanicilar: 'Bağışçılar',
    medya: 'Medya Yönetimi',
    ayarlar: 'Site Ayarları'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  
  // Load page content
  const contentArea = document.getElementById('contentArea');
  
  switch(page) {
    case 'dashboard':
      renderDashboard(contentArea);
      break;
    case 'bagislar':
      renderBagislar(contentArea);
      break;
    case 'kurbanlar':
      renderKurbanlar(contentArea);
      break;
    case 'kullanicilar':
      renderKullanicilar(contentArea);
      break;
    case 'medya':
      renderMedya(contentArea);
      break;
    case 'ayarlar':
      renderAyarlar(contentArea);
      break;
  }
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard(container) {
  const kurbanlar = allBagislar.filter(b => 
    (b.tur || '').includes('Kurban') || (b.baslik || '').includes('Kurban')
  );
  const bekleyen = kurbanlar.filter(b => b.durum === 'bekliyor').length;
  const toplam = allBagislar.reduce((sum, b) => sum + Number(b.tutar || 0), 0);
  
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-hand-holding-heart"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${allBagislar.length}</div>
          <div class="stat-label">Toplam Bağış</div>
        </div>
      </div>
      
      <div class="stat-card info">
        <div class="stat-icon">
          <i class="fas fa-lira-sign"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${toplam.toLocaleString('tr-TR')} ₺</div>
          <div class="stat-label">Toplam Tutar</div>
        </div>
      </div>
      
      <div class="stat-card success">
        <div class="stat-icon">
          <i class="fas fa-cow"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${kurbanlar.length}</div>
          <div class="stat-label">Kurban Bağışı</div>
        </div>
      </div>
      
      <div class="stat-card warning">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${bekleyen}</div>
          <div class="stat-label">Bekleyen Kurban</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-chart-line"></i>
          Son Bağışlar
        </h3>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('bagislar')">
          Tümünü Gör
        </button>
      </div>
      <div class="card-body">
        ${renderRecentBagislar()}
      </div>
    </div>
  `;
}

function renderRecentBagislar() {
  const recent = allBagislar.slice(-10).reverse();
  
  if (!recent.length) {
    return '<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p class="empty-title">Henüz bağış yok</p></div>';
  }
  
  const rows = recent.map(b => `
    <tr>
      <td style="font-family:monospace;color:var(--gray-500);font-size:12px;">${b.id}</td>
      <td><strong>${b.ad || ''} ${b.soyad || ''}</strong></td>
      <td>${b.tel || '-'}</td>
      <td>${getBadgeHTML(b.tur)}</td>
      <td style="font-weight:700;color:var(--primary);">${Number(b.tutar || 0).toLocaleString('tr-TR')} ₺</td>
      <td style="font-size:13px;color:var(--gray-600);">${formatDate(b.tarih)}</td>
      <td>${getDurumBadge(b.durum)}</td>
    </tr>
  `).join('');
  
  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Ad Soyad</th>
            <th>Telefon</th>
            <th>Tür</th>
            <th>Tutar</th>
            <th>Tarih</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ============================================
// BAĞIŞLAR
// ============================================
function renderBagislar(container) {
  const sorted = [...allBagislar].reverse();
  
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-list"></i>
          Tüm Bağışlar (${sorted.length})
        </h3>
      </div>
      <div class="card-body">
        ${renderBagislarTable(sorted)}
      </div>
    </div>
  `;
}

function renderBagislarTable(bagislar) {
  if (!bagislar.length) {
    return '<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p class="empty-title">Henüz bağış yok</p></div>';
  }
  
  const rows = bagislar.map(b => `
    <tr>
      <td style="font-family:monospace;color:var(--gray-500);font-size:12px;">${b.id}</td>
      <td>
        <strong>${b.ad || ''} ${b.soyad || ''}</strong><br>
        <small style="color:var(--gray-500);">${b.kullaniciAdi || '-'}</small>
      </td>
      <td>${b.tel || '-'}</td>
      <td>${b.email || '-'}</td>
      <td>${getBadgeHTML(b.tur)}</td>
      <td>${b.baslik || '-'}</td>
      <td style="font-weight:700;color:var(--primary);">${Number(b.tutar || 0).toLocaleString('tr-TR')} ₺</td>
      <td style="font-size:13px;color:var(--gray-600);">${formatDate(b.tarih)}</td>
      <td>${getDurumBadge(b.durum)}</td>
    </tr>
  `).join('');
  
  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Ad Soyad</th>
            <th>Telefon</th>
            <th>E-posta</th>
            <th>Tür</th>
            <th>Başlık</th>
            <th>Tutar</th>
            <th>Tarih</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


// ============================================
// KURBAN YÖNETİMİ
// ============================================
function renderKurbanlar(container) {
  const kurbanlar = allBagislar.filter(b => 
    (b.tur || '').includes('Kurban') || (b.baslik || '').includes('Kurban')
  ).reverse();
  
  container.innerHTML = `
    <div style="background:#fff3e0;border-left:4px solid var(--warning);padding:16px;border-radius:var(--radius-lg);margin-bottom:24px;">
      <i class="fas fa-info-circle"></i>
      <strong>Kurban Yönetimi:</strong> Kurban bağışlarının durumunu buradan güncelleyebilir ve not ekleyebilirsiniz.
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-cow"></i>
          Kurban Bağışları (${kurbanlar.length})
        </h3>
      </div>
      <div class="card-body">
        ${renderKurbanlarTable(kurbanlar)}
      </div>
    </div>
  `;
}

function renderKurbanlarTable(kurbanlar) {
  if (!kurbanlar.length) {
    return '<div class="empty-state"><div class="empty-icon"><i class="fas fa-cow"></i></div><p class="empty-title">Henüz kurban bağışı yok</p></div>';
  }
  
  const rows = kurbanlar.map(b => `
    <tr>
      <td style="font-family:monospace;color:var(--gray-500);font-size:12px;">${b.id}</td>
      <td><strong>${b.ad || ''} ${b.soyad || ''}</strong></td>
      <td>${b.tel || '-'}</td>
      <td>${b.baslik || b.tur || '-'}</td>
      <td style="font-weight:700;color:var(--primary);">${Number(b.tutar || 0).toLocaleString('tr-TR')} ₺</td>
      <td style="font-size:13px;color:var(--gray-600);">${formatDate(b.tarih)}</td>
      <td id="durum-${b.id}">${getDurumBadge(b.durum)}</td>
      <td style="max-width:200px;font-size:13px;color:var(--gray-600);">${(b.not || '').substring(0, 50)}</td>
      <td>
        <div style="display:flex;gap:8px;">
          ${b.durum === 'bekliyor' 
            ? `<button class="btn btn-success btn-sm" onclick="toggleKurbanDurum('${b.id}', 'tamamlandi')">
                <i class="fas fa-check"></i> Kesildi
              </button>`
            : `<button class="btn btn-warning btn-sm" onclick="toggleKurbanDurum('${b.id}', 'bekliyor')">
                <i class="fas fa-clock"></i> Bekliyor
              </button>`
          }
          <button class="btn btn-secondary btn-sm" onclick="openNoteModal('${b.id}')">
            <i class="fas fa-sticky-note"></i> Not
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Ad Soyad</th>
            <th>Telefon</th>
            <th>Tür</th>
            <th>Tutar</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th>Not</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function toggleKurbanDurum(id, yeniDurum) {
  const not = yeniDurum === 'tamamlandi'
    ? 'Kurbanınız kesilmiştir. Allah kabul etsin.'
    : 'Kurban kesim işleminiz devam etmekte.';
  
  await BagisDB.guncelle(id, { durum: yeniDurum, not });
  await loadData();
  showToast('Durum güncellendi!', 'success');
  navigateTo('kurbanlar');
}

function openNoteModal(id) {
  const bagis = allBagislar.find(b => b.id === id);
  if (!bagis) return;
  
  const modal = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Not Ekle / Düzenle</h3>
          <button class="modal-close" onclick="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Bağışçı Notu (Görünür)</label>
            <textarea class="form-control" id="modalNot" rows="3">${bagis.not || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Yönetici Notu (Sadece yönetici görür)</label>
            <textarea class="form-control" id="modalEkNot" rows="3">${bagis.ekNot || ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
          <button class="btn btn-primary" onclick="saveNote('${id}')">
            <i class="fas fa-save"></i> Kaydet
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modalContainer').innerHTML = modal;
}

async function saveNote(id) {
  const not = document.getElementById('modalNot').value.trim();
  const ekNot = document.getElementById('modalEkNot').value.trim();
  
  await BagisDB.guncelle(id, { not, ekNot });
  await loadData();
  closeModal();
  showToast('Not kaydedildi!', 'success');
  navigateTo('kurbanlar');
}

function closeModal(event) {
  if (event && event.target.classList.contains('modal')) return;
  document.getElementById('modalContainer').innerHTML = '';
}

// ============================================
// KULLANICILAR
// ============================================
function renderKullanicilar(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-users"></i>
          Bağışçılar (${allKullanicilar.length})
        </h3>
      </div>
      <div class="card-body">
        ${renderKullanicilarTable()}
      </div>
    </div>
  `;
}

function renderKullanicilarTable() {
  if (!allKullanicilar.length) {
    return '<div class="empty-state"><div class="empty-icon"><i class="fas fa-users"></i></div><p class="empty-title">Henüz kayıtlı bağışçı yok</p></div>';
  }
  
  const rows = allKullanicilar.map(u => {
    const userBagislar = allBagislar.filter(b => b.kullaniciAdi === u.kullaniciAdi);
    const toplam = userBagislar.reduce((sum, b) => sum + Number(b.tutar || 0), 0);
    
    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:var(--primary);">${u.kullaniciAdi}</td>
        <td><strong>${u.ad || ''} ${u.soyad || ''}</strong></td>
        <td>${u.tel || '-'}</td>
        <td>${u.email || '-'}</td>
        <td style="font-size:13px;color:var(--gray-600);">${formatDate(u.kayitTarihi)}</td>
        <td style="text-align:center;font-weight:700;">${userBagislar.length}</td>
        <td style="font-weight:700;color:var(--primary);">${toplam.toLocaleString('tr-TR')} ₺</td>
      </tr>
    `;
  }).join('');
  
  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Kullanıcı Adı</th>
            <th>Ad Soyad</th>
            <th>Telefon</th>
            <th>E-posta</th>
            <th>Kayıt Tarihi</th>
            <th style="text-align:center;">Bağış Sayısı</th>
            <th>Toplam Tutar</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ============================================
// MEDYA YÖNETİMİ
// ============================================
function renderMedya(container) {
  loadMediaFiles();
  
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-images"></i>
          Medya Kütüphanesi
        </h3>
        <button class="btn btn-primary" onclick="document.getElementById('fileUpload').click()">
          <i class="fas fa-upload"></i> Yeni Yükle
        </button>
      </div>
      <div class="card-body">
        <input type="file" id="fileUpload" multiple accept="image/*" style="display:none;" onchange="handleFileUpload(event)">
        
        <div class="upload-zone" onclick="document.getElementById('fileUpload').click()" 
             ondragover="handleDragOver(event)" 
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event)">
          <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <p class="upload-text">Dosyaları buraya sürükleyin veya tıklayın</p>
          <p class="upload-hint">PNG, JPG, WEBP - Maksimum 5MB</p>
        </div>
        
        <div id="mediaGrid" class="media-grid" style="margin-top:24px;">
          ${renderMediaGrid()}
        </div>
      </div>
    </div>
  `;
}

function loadMediaFiles() {
  // Site üzerindeki mevcut görselleri listele
  mediaFiles = [
    { name: 'gazze1.jpg', path: 'gazze1.jpg', type: 'image' },
    { name: 'gazze2.jpg', path: 'gazze2.jpg', type: 'image' },
    { name: 'gazze3.jpg', path: 'gazze3.jpg', type: 'image' },
    { name: 'gazze4.webp', path: 'gazze4.webp', type: 'image' },
    { name: 'gazze5.jpg', path: 'gazze5.jpg', type: 'image' },
    { name: 'gazze6.webp', path: 'gazze6.webp', type: 'image' },
    { name: 'kurban1.png', path: 'kurban1.png', type: 'image' },
    { name: 'kurban1.jpg', path: 'kurban1.jpg', type: 'image' },
    { name: 'filistin1.png', path: 'filistin1.png', type: 'image' },
    { name: 'siyahcocuk.jpg', path: 'siyahcocuk.jpg', type: 'image' },
    { name: 'cocukafrika.jpg', path: 'cocukafrika.jpg', type: 'image' },
    { name: 'yetimprojesi.png', path: 'yetimprojesi.png', type: 'image' },
    { name: 'ortafoto.jpg', path: 'ortafoto.jpg', type: 'image' },
    { name: 'icderyazi.png', path: 'icderyazi.png', type: 'image' }
  ];
}

function renderMediaGrid() {
  if (!mediaFiles.length) {
    return '<div class="empty-state"><div class="empty-icon"><i class="fas fa-images"></i></div><p class="empty-title">Henüz medya dosyası yok</p></div>';
  }
  
  return mediaFiles.map(file => `
    <div class="media-item">
      <img src="${file.path}" alt="${file.name}" loading="lazy">
      <div class="media-overlay">
        <p class="media-name">${file.name}</p>
        <div class="media-actions">
          <button class="btn btn-sm btn-primary" onclick="viewMedia('${file.path}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-secondary" onclick="copyMediaPath('${file.path}')">
            <i class="fas fa-copy"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteMedia('${file.name}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('dragover');
  const files = event.dataTransfer.files;
  uploadFiles(files);
}

function handleFileUpload(event) {
  const files = event.target.files;
  uploadFiles(files);
}

function uploadFiles(files) {
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      // Gerçek uygulamada sunucuya yüklenecek
      showToast(`${file.name} yüklendi!`, 'success');
      mediaFiles.push({
        name: file.name,
        path: URL.createObjectURL(file),
        type: 'image'
      });
      document.getElementById('mediaGrid').innerHTML = renderMediaGrid();
    } else {
      showToast(`${file.name} desteklenmiyor!`, 'error');
    }
  });
}

function viewMedia(path) {
  window.open(path, '_blank');
}

function copyMediaPath(path) {
  navigator.clipboard.writeText(path);
  showToast('Yol kopyalandı!', 'success');
}

function deleteMedia(name) {
  if (confirm(`${name} dosyasını silmek istediğinizden emin misiniz?`)) {
    mediaFiles = mediaFiles.filter(f => f.name !== name);
    document.getElementById('mediaGrid').innerHTML = renderMediaGrid();
    showToast('Dosya silindi!', 'success');
  }
}


// ============================================
// AYARLAR
// ============================================
async function renderAyarlar(container) {
  const config = await SiteConfig.getFromServer();
  
  container.innerHTML = `
    <div style="max-width:900px;">
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-phone"></i>
            İletişim Bilgileri
          </h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Telefon</label>
            <input type="text" class="form-control" id="cfg_telefon" value="${config.telefon || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp (ülke koduyla)</label>
            <input type="text" class="form-control" id="cfg_whatsapp" value="${config.whatsapp || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">E-posta</label>
            <input type="email" class="form-control" id="cfg_email" value="${config.email || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Adres</label>
            <textarea class="form-control" id="cfg_adres" rows="2">${config.adres || ''}</textarea>
          </div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-share-alt"></i>
            Sosyal Medya
          </h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Facebook URL</label>
            <input type="url" class="form-control" id="cfg_facebook" value="${config.facebook || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">X (Twitter) URL</label>
            <input type="url" class="form-control" id="cfg_twitter" value="${config.twitter || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Instagram URL</label>
            <input type="url" class="form-control" id="cfg_instagram" value="${config.instagram || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">YouTube URL</label>
            <input type="url" class="form-control" id="cfg_youtube" value="${config.youtube || ''}">
          </div>
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <button class="btn btn-secondary" onclick="navigateTo('dashboard')">
          <i class="fas fa-arrow-left"></i> Geri
        </button>
        <button class="btn btn-primary" onclick="saveSettings()">
          <i class="fas fa-save"></i> Ayarları Kaydet
        </button>
      </div>
    </div>
  `;
}

async function saveSettings() {
  const fields = ['telefon', 'whatsapp', 'email', 'adres', 'facebook', 'twitter', 'instagram', 'youtube'];
  const config = {};
  
  fields.forEach(field => {
    const el = document.getElementById('cfg_' + field);
    if (el) config[field] = el.value.trim();
  });
  
  await SiteConfig.save(config);
  showToast('Ayarlar kaydedildi!', 'success');
}

// ============================================
// SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('show');
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.querySelector('.user-menu');
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && !userMenu?.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBadgeHTML(tur) {
  if (!tur) return '<span class="badge badge-info">Genel</span>';
  if (tur.includes('Kurban')) return '<span class="badge badge-danger">Kurban</span>';
  if (tur.includes('Zekat')) return '<span class="badge badge-success">Zekat</span>';
  if (tur.includes('Fitre')) return '<span class="badge badge-info">Fitre</span>';
  if (tur.includes('Sadaka')) return '<span class="badge badge-warning">Sadaka</span>';
  return `<span class="badge badge-info">${tur}</span>`;
}

function getDurumBadge(durum) {
  if (durum === 'tamamlandi') {
    return '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Kesildi</span>';
  }
  return '<span class="badge badge-warning"><i class="fas fa-clock"></i> Bekliyor</span>';
}

function showToast(message, type = 'info') {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  const titles = {
    success: 'Başarılı',
    error: 'Hata',
    warning: 'Uyarı',
    info: 'Bilgi'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icons[type]}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  document.getElementById('toastContainer').appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add slideOutRight animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`;
document.head.appendChild(style);

// ============================================
// RESPONSIVE MOBILE MENU
// ============================================
if (window.innerWidth <= 1024) {
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.btn-menu-toggle');
    
    if (sidebar && !sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
      sidebar.classList.remove('show');
    }
  });
}

// Mobile menu toggle
document.querySelector('.btn-menu-toggle')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('show');
});
