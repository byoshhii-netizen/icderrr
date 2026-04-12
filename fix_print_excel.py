with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

# ── Yazdır fonksiyonunu düzelt: window.open yerine blob URL
old_yazdir = '''function yazdir(tip) {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(yazdirilabilirHTML(tip));
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}'''

new_yazdir = '''function yazdir(tip) {
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
}'''

c = c.replace(old_yazdir, new_yazdir)

# ── yazdirKurban fonksiyonunu düzelt
old_yk = '''async function yazdirKurban(kurbanId, kurbanNo, tur) {
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  const kurbanData = _kurbanlar.find(k => k.id === kurbanId) || {};
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(kurbanYazdirHTML(kurbanNo, tur, hisseler, kurbanData));
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}'''

new_yk = '''async function yazdirKurban(kurbanId, kurbanNo, tur) {
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  const kurbanData = _kurbanlar.find(k => k.id === kurbanId) || {};
  const html = kurbanYazdirHTML(kurbanNo, tur, hisseler, kurbanData);
  printHTML(html);
}'''

c = c.replace(old_yk, new_yk)

# ── yazdirKurbanSatir düzelt
old_yks = '''async function yazdirKurbanSatir(kurbanId) {
  const k = _kurbanlar.find(x => x.id === kurbanId);
  if (!k) return;
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(kurbanYazdirHTML(k.kurban_no, k.tur, hisseler, k));
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}'''

new_yks = '''async function yazdirKurbanSatir(kurbanId) {
  const k = _kurbanlar.find(x => x.id === kurbanId);
  if (!k) return;
  const hisseler = await api('GET', '/kurbanlar/' + kurbanId + '/hisseler');
  printHTML(kurbanYazdirHTML(k.kurban_no, k.tur, hisseler, k));
}'''

c = c.replace(old_yks, new_yks)

# ── tumKurbanlariYazdir düzelt
old_tky = '''async function tumKurbanlariYazdir() {
  if (!S.orgId) return toast('Once organizasyon secin', 'error');
  if (!_kurbanlar.length) return toast('Kurban bulunamadi', 'error');

  let allHtml = '';
  for (const k of _kurbanlar) {
    const hisseler = await api('GET', '/kurbanlar/' + k.id + '/hisseler');
    allHtml += kurbanYazdirHTML(k.kurban_no, k.tur, hisseler, k);
    allHtml += '<div style="page-break-after:always"></div>';
  }

  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(allHtml);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 600);
}'''

new_tky = '''async function tumKurbanlariYazdir() {
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
    allHtml += '<strong style="font-size:14px;color:#1a2a50">DEFTERDAR MUHASEBE &mdash; Kurban #' + k.kurban_no + '</strong>';
    allHtml += '<span style="font-size:11px;color:#555">' + esc(S.orgAd) + ' | ' + S.orgYil + '</span></div>';
    allHtml += '<table style="width:100%;border-collapse:collapse;margin-bottom:8px"><tr style="background:#1a2a50;color:#fff"><th style="padding:5px">Hisse</th><th>Bagisci</th><th>Telefon</th><th>Kimin Adina</th><th>Odeme</th><th>Video</th></tr>' + rows + '</table>';
    allHtml += '<div style="font-size:10px;color:#999;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:4px"><span>Defterdar Muhasebe</span><span>Founder: Ismail DEMIRCAN</span></div>';
    allHtml += '</div><div class="pb"></div>';
  }
  allHtml += '</body></html>';
  printHTML(allHtml);
}'''

c = c.replace(old_tky, new_tky)

# ── yazdirBagiscilar düzelt
old_yb = '''  const w = window.open('', '_blank', 'width=1000,height=700');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}'''

new_yb = '''  printHTML(html);
}'''

c = c.replace(old_yb, new_yb)

# ── Excel indirme: window.location.href yerine fetch+blob
old_excel1 = "  window.location.href = '/api/organizasyonlar/' + S.orgId + '/excel';"
new_excel1 = "  downloadExcel('/api/organizasyonlar/' + S.orgId + '/excel', 'defterdar-rapor.xlsx');"
c = c.replace(old_excel1, new_excel1)

old_excel2 = "  window.location.href = '/api/organizasyonlar/' + S.orgId + '/excel?sayfa=bagiscilar';"
new_excel2 = "  downloadExcel('/api/organizasyonlar/' + S.orgId + '/excel?sayfa=bagiscilar', 'bagiscilar.xlsx');"
c = c.replace(old_excel2, new_excel2)

old_excel3 = "  window.location.href = '/api/kurbanlar/' + kurbanId + '/excel';"
new_excel3 = "  downloadExcel('/api/kurbanlar/' + kurbanId + '/excel', 'kurban-' + kurbanId + '.xlsx');"
c = c.replace(old_excel3, new_excel3)

old_excel4 = "  window.location.href = '/api/organizasyonlar/' + S.orgId + '/excel';\n}"
new_excel4 = "  downloadExcel('/api/organizasyonlar/' + S.orgId + '/excel', 'defterdar-tum-kurbanlar.xlsx');\n}"
c = c.replace(old_excel4, new_excel4)

# ── printHTML ve downloadExcel yardımcı fonksiyonlarını ekle (INIT'ten önce)
helper = '''
// ─── YAZDIR / EXCEL YARDIMCI ─────────────────────────────────────────────────
function printHTML(html) {
  const blob = new Blob([html], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
  document.body.appendChild(iframe);
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {}
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 3000);
  };
}

async function downloadExcel(url, filename) {
  try {
    toast('Excel hazirlaniyor...');
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
  } catch(e) { toast('Excel indirilemedi: ' + e.message, 'error'); }
}

'''

c = c.replace('// ─── INIT ─────────────────────────────────────────────────────────────────────', helper + '// ─── INIT ─────────────────────────────────────────────────────────────────────')

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('DONE')
