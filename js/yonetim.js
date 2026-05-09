/* ============================================
   ICDER – Yonetim Paneli
   Sifre: icder2026
   Route: /yonetim
   ============================================ */

const ADMIN_SIFRE = 'icder2026';

const root = document.getElementById('root');

/* ---- YARDIMCI ---- */
function fmt(n) { return Number(n||0).toLocaleString('tr-TR'); }
function tarih(iso) { return iso ? new Date(iso).toLocaleString('tr-TR') : '-'; }
function esc(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---- GIRIS EKRANI ---- */
function renderGiris(hata) {
  root.innerHTML = `
    <div style="min-height:100vh;background:#f9fbe7;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:#fff;border-radius:20px;padding:48px 40px;max-width:400px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.12);text-align:center;">
        <div style="width:72px;height:72px;background:#e8f5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:30px;color:#2e7d32;">
          <i class="fa fa-shield-halved"></i>
        </div>
        <h2 style="color:#1b5e20;font-size:1.6rem;font-weight:800;margin-bottom:6px;">Yonetim Paneli</h2>
        <p style="color:#888;font-size:14px;margin-bottom:28px;">Devam etmek icin sifreyi girin</p>
        ${hata ? `<div style="background:#ffebee;color:#c62828;padding:10px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;">${hata}</div>` : ''}
        <input id="sifreInput" type="password" placeholder="Sifre" autocomplete="current-password"
          style="width:100%;padding:14px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none;margin-bottom:14px;box-sizing:border-box;"
          onkeydown="if(event.key==='Enter')girisKontrol()" />
        <button onclick="girisKontrol()"
          style="width:100%;background:#2e7d32;color:#fff;padding:14px;border-radius:10px;font-weight:800;font-size:16px;border:none;cursor:pointer;">
          <i class="fa fa-arrow-right-to-bracket"></i> Giris Yap
        </button>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('sifreInput')?.focus(), 100);
}

function girisKontrol() {
  const val = document.getElementById('sifreInput')?.value;
  if (val === ADMIN_SIFRE) {
    sessionStorage.setItem('icder_admin', '1');
    renderPanel();
  } else {
    renderGiris('Yanlis sifre. Lutfen tekrar deneyin.');
  }
}

/* ---- ANA PANEL ---- */
function renderPanel() {
  const bagislar = BagisDB.hepsiniGetir();
  const kurbanlar = bagislar.filter(b => (b.tur||'').includes('Kurban') || (b.baslik||'').includes('Kurban'));
  const toplam = bagislar.reduce((s,b) => s + Number(b.tutar||0), 0);
  const bekleyen = kurbanlar.filter(b => b.durum === 'bekliyor').length;

  root.innerHTML = `
    <div style="min-height:100vh;background:#f0f4f0;">

      <!-- TOPBAR -->
      <div style="background:#1b5e20;color:#fff;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="../icderyazi.png" style="height:36px;filter:brightness(0) invert(1);" alt="ICDER" />
          <span style="font-weight:800;font-size:16px;letter-spacing:.5px;">YONETIM PANELI</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <a href="/" style="color:rgba(255,255,255,.8);font-size:13px;text-decoration:none;"><i class="fa fa-house"></i> Siteye Don</a>
          <button onclick="cikis()" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13px;">
            <i class="fa fa-right-from-bracket"></i> Cikis
          </button>
        </div>
      </div>

      <!-- STATS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px 28px 0;">
        ${statKart('fa-hand-holding-heart','Toplam Bagis', bagislar.length, '#2e7d32')}
        ${statKart('fa-turkish-lira-sign','Toplam Tutar', fmt(toplam)+' TL', '#1b5e20')}
        ${statKart('fa-moon','Kurban Bagisi', kurbanlar.length, '#388e3c')}
        ${statKart('fa-clock','Bekleyen Kurban', bekleyen, '#f57f17')}
      </div>

      <!-- TABS -->
      <div style="padding:24px 28px 0;">
        <div style="display:flex;gap:4px;background:#fff;border-radius:12px;padding:6px;box-shadow:0 2px 8px rgba(0,0,0,.06);width:fit-content;">
          <button class="ptab active" id="tab-tumBagislar" onclick="switchTab('tumBagislar')">
            <i class="fa fa-list"></i> Tum Bagislar
          </button>
          <button class="ptab" id="tab-kurbanlar" onclick="switchTab('kurbanlar')">
            <i class="fa fa-moon"></i> Kurban Bagislari
          </button>
          <button class="ptab" id="tab-kullanicilar" onclick="switchTab('kullanicilar')">
            <i class="fa fa-users"></i> Bagiscilar
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div style="padding:20px 28px 40px;" id="panelContent">
        <!-- JS ile doldurulur -->
      </div>
    </div>

    <style>
      .ptab { padding:9px 18px;border:none;background:none;border-radius:8px;font-size:13px;font-weight:700;color:#666;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px; }
      .ptab.active { background:#2e7d32;color:#fff; }
      .ptab:hover:not(.active) { background:#e8f5e9;color:#1b5e20; }
      .tablo { width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07); }
      .tablo th { background:#1b5e20;color:#fff;padding:13px 16px;text-align:left;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase; }
      .tablo td { padding:12px 16px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;vertical-align:middle; }
      .tablo tr:last-child td { border-bottom:none; }
      .tablo tr:hover td { background:#f9fbe7; }
      .badge-bekliyor { background:#fff8e1;color:#f57f17;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700; }
      .badge-kesildi  { background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700; }
      .badge-diger    { background:#f5f5f5;color:#555;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700; }
      .btn-sm { padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all .2s; }
      .btn-kesildi { background:#2e7d32;color:#fff; }
      .btn-bekliyor { background:#fff8e1;color:#f57f17;border:1px solid #f57f17; }
      .not-input { width:100%;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none;resize:none; }
      .not-input:focus { border-color:#2e7d32; }
      .detay-panel { background:#f9fbe7;border-radius:10px;padding:16px;margin-top:8px;border-left:3px solid #2e7d32; }
    </style>
  `;

  switchTab('tumBagislar');
}

function statKart(icon, label, val, renk) {
  return `<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-left:4px solid ${renk};">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;background:${renk}22;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;color:${renk};">
        <i class="fa ${icon}"></i>
      </div>
      <div>
        <div style="font-size:22px;font-weight:800;color:#1b5e20;">${val}</div>
        <div style="font-size:12px;color:#888;">${label}</div>
      </div>
    </div>
  </div>`;
}

let aktifTab = 'tumBagislar';
function switchTab(tab) {
  aktifTab = tab;
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+tab)?.classList.add('active');
  const c = document.getElementById('panelContent');
  if (tab === 'tumBagislar') c.innerHTML = renderTumBagislar();
  else if (tab === 'kurbanlar') c.innerHTML = renderKurbanlar();
  else if (tab === 'kullanicilar') c.innerHTML = renderKullanicilar();
}

/* ---- TUM BAGISLAR ---- */
function renderTumBagislar() {
  const list = BagisDB.hepsiniGetir().slice().reverse();
  if (!list.length) return bosEkran('Henuz bagis yok.');
  return `
    <div style="overflow-x:auto;">
      <table class="tablo">
        <thead>
          <tr>
            <th>ID</th><th>Ad Soyad</th><th>Telefon</th>
            <th>Bagis Turu</th><th>Baslik</th><th>Tutar</th>
            <th>Tarih</th><th>Durum</th><th>Islem</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(b => `
            <tr>
              <td style="font-family:monospace;font-size:11px;color:#aaa;">${esc(b.id)}</td>
              <td><strong>${esc(b.ad||'')} ${esc(b.soyad||'')}</strong><br/><span style="font-size:11px;color:#aaa;">${esc(b.kullaniciAdi||'')}</span></td>
              <td>${esc(b.tel||'-')}</td>
              <td><span class="badge-diger">${esc(b.tur||'-')}</span></td>
              <td>${esc(b.baslik||'-')}</td>
              <td style="font-weight:800;color:#1b5e20;">${fmt(b.tutar)} TL</td>
              <td style="font-size:12px;">${tarih(b.tarih)}</td>
              <td>${durumBadge(b.durum)}</td>
              <td>
                <button class="btn-sm" style="background:#e8f5e9;color:#1b5e20;" onclick="detayAc('${b.id}')">
                  <i class="fa fa-eye"></i> Detay
                </button>
              </td>
            </tr>
            <tr id="detay-${b.id}" style="display:none;">
              <td colspan="9">${detayHTML(b)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---- KURBAN BAGISLARI ---- */
function renderKurbanlar() {
  const list = BagisDB.hepsiniGetir()
    .filter(b => (b.tur||'').includes('Kurban') || (b.baslik||'').includes('Kurban'))
    .slice().reverse();
  if (!list.length) return bosEkran('Henuz kurban bagisi yok.');
  return `
    <div style="margin-bottom:16px;padding:14px 18px;background:#fff8e1;border-radius:10px;border-left:3px solid #f57f17;font-size:13px;color:#555;">
      <i class="fa fa-info-circle" style="color:#f57f17;"></i>
      Kurban bagislarini asagidan yonetebilirsiniz. Durum degistirince bagisci aninda gorur.
    </div>
    <div style="overflow-x:auto;">
      <table class="tablo">
        <thead>
          <tr>
            <th>ID</th><th>Ad Soyad</th><th>Tel</th>
            <th>Tur</th><th>Tutar</th><th>Tarih</th>
            <th>Durum</th><th>Not</th><th>Islem</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(b => `
            <tr id="krow-${b.id}">
              <td style="font-family:monospace;font-size:11px;color:#aaa;">${esc(b.id)}</td>
              <td><strong>${esc(b.ad||'')} ${esc(b.soyad||'')}</strong></td>
              <td>${esc(b.tel||'-')}</td>
              <td>${esc(b.baslik||b.tur||'-')}</td>
              <td style="font-weight:800;color:#1b5e20;">${fmt(b.tutar)} TL</td>
              <td style="font-size:12px;">${tarih(b.tarih)}</td>
              <td id="durum-${b.id}">${durumBadge(b.durum)}</td>
              <td style="max-width:200px;font-size:12px;color:#555;">${esc(b.not||'').substring(0,60)}${(b.not||'').length>60?'...':''}</td>
              <td>
                <div style="display:flex;flex-direction:column;gap:6px;min-width:160px;">
                  ${b.durum === 'bekliyor'
                    ? `<button class="btn-sm btn-kesildi" onclick="durumDegistir('${b.id}','tamamlandi')"><i class="fa fa-check"></i> Kesildi Isaretle</button>`
                    : `<button class="btn-sm btn-bekliyor" onclick="durumDegistir('${b.id}','bekliyor')"><i class="fa fa-clock"></i> Bekliyor Yap</button>`
                  }
                  <button class="btn-sm" style="background:#e8f5e9;color:#1b5e20;" onclick="notPanelAc('${b.id}')">
                    <i class="fa fa-comment-dots"></i> Not Ekle
                  </button>
                </div>
              </td>
            </tr>
            <tr id="notpanel-${b.id}" style="display:none;">
              <td colspan="9">
                <div class="detay-panel">
                  <div style="font-size:12px;font-weight:700;color:#1b5e20;margin-bottom:8px;">Yonetici Notu (bagisci gorecek)</div>
                  <textarea id="nottext-${b.id}" class="not-input" rows="2" placeholder="Ana not...">${esc(b.not||'')}</textarea>
                  <div style="font-size:12px;font-weight:700;color:#1b5e20;margin:8px 0 4px;">Ek Not</div>
                  <textarea id="eknot-${b.id}" class="not-input" rows="2" placeholder="Ek not (opsiyonel)...">${esc(b.ekNot||'')}</textarea>
                  <div style="display:flex;gap:8px;margin-top:10px;">
                    <button class="btn-sm btn-kesildi" onclick="notKaydet('${b.id}')"><i class="fa fa-save"></i> Kaydet</button>
                    <button class="btn-sm" style="background:#f5f5f5;color:#555;" onclick="notPanelKapat('${b.id}')">Iptal</button>
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---- KULLANICILAR ---- */
function renderKullanicilar() {
  const users = BagisDB.kullanicilariGetir();
  const bagislar = BagisDB.hepsiniGetir();
  if (!users.length) return bosEkran('Henuz kayitli bagisci yok.');
  return `
    <div style="overflow-x:auto;">
      <table class="tablo">
        <thead>
          <tr>
            <th>Kullanici Adi</th><th>Ad Soyad</th><th>Telefon</th>
            <th>E-posta</th><th>Kayit Tarihi</th><th>Bagis Sayisi</th><th>Toplam</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => {
            const ub = bagislar.filter(b => b.kullaniciAdi === u.kullaniciAdi);
            const top = ub.reduce((s,b) => s+Number(b.tutar||0), 0);
            return `
              <tr>
                <td style="font-family:monospace;font-weight:700;color:#1b5e20;">${esc(u.kullaniciAdi)}</td>
                <td>${esc(u.ad||'')} ${esc(u.soyad||'')}</td>
                <td>${esc(u.tel||'-')}</td>
                <td>${esc(u.email||'-')}</td>
                <td style="font-size:12px;">${tarih(u.kayitTarihi)}</td>
                <td style="text-align:center;font-weight:700;">${ub.length}</td>
                <td style="font-weight:800;color:#1b5e20;">${fmt(top)} TL</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---- DETAY ---- */
function detayHTML(b) {
  return `
    <div class="detay-panel">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:13px;">
        <div><span style="color:#888;font-size:11px;">ID</span><br/><strong style="font-family:monospace;">${esc(b.id)}</strong></div>
        <div><span style="color:#888;font-size:11px;">Kullanici Adi</span><br/><strong>${esc(b.kullaniciAdi||'-')}</strong></div>
        <div><span style="color:#888;font-size:11px;">Tarih</span><br/><strong>${tarih(b.tarih)}</strong></div>
        <div><span style="color:#888;font-size:11px;">Ad Soyad</span><br/><strong>${esc(b.ad||'')} ${esc(b.soyad||'')}</strong></div>
        <div><span style="color:#888;font-size:11px;">Telefon</span><br/><strong>${esc(b.tel||'-')}</strong></div>
        <div><span style="color:#888;font-size:11px;">E-posta</span><br/><strong>${esc(b.email||'-')}</strong></div>
        <div><span style="color:#888;font-size:11px;">Bagis Turu</span><br/><strong>${esc(b.tur||'-')}</strong></div>
        <div><span style="color:#888;font-size:11px;">Baslik</span><br/><strong>${esc(b.baslik||'-')}</strong></div>
        <div><span style="color:#888;font-size:11px;">Tutar</span><br/><strong style="color:#1b5e20;font-size:16px;">${fmt(b.tutar)} TL</strong></div>
        <div><span style="color:#888;font-size:11px;">Durum</span><br/>${durumBadge(b.durum)}</div>
      </div>
      ${b.not ? `<div style="margin-top:12px;padding:10px;background:#fff;border-radius:8px;font-size:13px;"><strong>Not:</strong> ${esc(b.not)}</div>` : ''}
      ${b.ekNot ? `<div style="margin-top:6px;padding:10px;background:#fff;border-radius:8px;font-size:13px;"><strong>Ek Not:</strong> ${esc(b.ekNot)}</div>` : ''}
    </div>`;
}

function detayAc(id) {
  const row = document.getElementById('detay-'+id);
  if (!row) return;
  row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
}

/* ---- ISLEMLER ---- */
function durumDegistir(id, yeniDurum) {
  const varsayilanNot = yeniDurum === 'tamamlandi'
    ? 'Kurbaniniz kesilmistir. Allah kabul etsin.'
    : 'Kurban kesim isleminiz hala devam etmekte. Kesildikten sonra kesildigini buradan gorebilirsiniz.';
  BagisDB.guncelle(id, { durum: yeniDurum, not: varsayilanNot });
  switchTab('kurbanlar');
}

function notPanelAc(id) {
  const p = document.getElementById('notpanel-'+id);
  if (p) p.style.display = p.style.display === 'none' ? 'table-row' : 'none';
}

function notPanelKapat(id) {
  const p = document.getElementById('notpanel-'+id);
  if (p) p.style.display = 'none';
}

function notKaydet(id) {
  const not = document.getElementById('nottext-'+id)?.value || '';
  const ekNot = document.getElementById('eknot-'+id)?.value || '';
  BagisDB.guncelle(id, { not, ekNot });
  notPanelKapat(id);
  const cell = document.querySelector(`#krow-${id} td:nth-child(8)`);
  if (cell) cell.textContent = not.substring(0,60) + (not.length>60?'...':'');
  alert('Not kaydedildi. Bagisci aninda gorecek.');
}

function durumBadge(d) {
  if (d === 'tamamlandi') return '<span class="badge-kesildi"><i class="fa fa-check"></i> Kesildi</span>';
  if (d === 'bekliyor')   return '<span class="badge-bekliyor"><i class="fa fa-clock"></i> Bekliyor</span>';
  return '<span class="badge-diger">Tamamlandi</span>';
}

function bosEkran(msg) {
  return `<div style="text-align:center;padding:60px;color:#aaa;"><i class="fa fa-inbox" style="font-size:48px;margin-bottom:16px;"></i><p>${msg}</p></div>`;
}

function cikis() {
  sessionStorage.removeItem('icder_admin');
  renderGiris();
}

/* ---- INIT ---- */
if (sessionStorage.getItem('icder_admin') === '1') {
  renderPanel();
} else {
  renderGiris();
}

// Diger sekmelerden gelen degisiklikleri dinle
window.addEventListener('storage', () => {
  if (sessionStorage.getItem('icder_admin') === '1' && aktifTab) {
    switchTab(aktifTab);
  }
});
