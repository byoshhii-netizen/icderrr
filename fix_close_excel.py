with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

# ── Excel URL düzeltmesi: tam URL kullan
# downloadExcel fonksiyonunda url parametresi /api/... şeklinde geliyor
# electronAPI.downloadFile'a tam URL geçmeli
old_dl = "    const result = await window.electronAPI.downloadFile('http://127.0.0.1:4500' + url, filename);"
new_dl = "    const fullUrl = url.startsWith('http') ? url : 'http://127.0.0.1:4500' + url;\n    const result = await window.electronAPI.downloadFile(fullUrl, filename);"
c = c.replace(old_dl, new_dl)

# ── Kapatma öncesi yedek sistemi - INIT'e ekle
old_init = "document.addEventListener('DOMContentLoaded', () => showPage('organizasyonlar'));"
new_init = """document.addEventListener('DOMContentLoaded', () => {
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
    const filename = 'defterdar-yedek-' + tarih + '.xlsx';
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
}"""

c = c.replace(old_init, new_init)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('DONE')
