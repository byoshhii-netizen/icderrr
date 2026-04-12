with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

old = '''async function printHTML(html) {
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
}'''

new = '''async function printHTML(html) {
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
}'''

if old in c:
    c = c.replace(old, new)
    print('REPLACED')
else:
    print('NOT FOUND')

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)
