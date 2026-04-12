with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

old_helper = '''// ─── YAZDIR / EXCEL YARDIMCI ─────────────────────────────────────────────────
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
}'''

new_helper = '''// ─── YAZDIR / EXCEL YARDIMCI ─────────────────────────────────────────────────
async function printHTML(html) {
  if (window.electronAPI && window.electronAPI.printHTML) {
    // Electron: IPC ile native print
    await window.electronAPI.printHTML(html);
  } else {
    // Tarayıcı fallback
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) setTimeout(() => { w.print(); }, 600);
  }
}

async function downloadExcel(url, filename) {
  try {
    toast('Excel hazirlaniyor...');
    if (window.electronAPI && window.electronAPI.downloadFile) {
      // Electron: native save dialog
      const result = await window.electronAPI.downloadFile('http://127.0.0.1:4500' + url, filename);
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
}'''

c = c.replace(old_helper, new_helper)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('DONE' if old_helper in open('public/app.js', 'r', encoding='utf-8').read() == False else 'REPLACED')
