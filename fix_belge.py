with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

# ── kurbanYazdirHTML footer güncelle
old_footer = "    '<div class=\"footer\"><span>Defterdar Muhasebe &mdash; CMS Team</span><span>Founder: Ismail DEMIRCAN</span></div>' +"
new_footer = "    '<div class=\"footer\"><span>Defterdar Muhasebe &mdash; CMS Team</span></div>' +"
c = c.replace(old_footer, new_footer)

# ── kurbanYazdirHTML header güncelle - sol üst icder.png, sağ üst cad.png
old_header = "    '<div class=\"header\">' +" + "\n" + \
             "    '<div class=\"hl\">DEFTERDAR MUHASEBE<small>Kurban Belgesi &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +" + "\n" + \
             "    '<div style=\"font-size:11px;color:#555;text-align:right\">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +" + "\n" + \
             "    '</div>' +"

new_header = "    '<div class=\"header\">' +" + "\n" + \
             "    '<div style=\"display:flex;align-items:center;gap:10px\">' +" + "\n" + \
             "    '<img src=\"icder.png\" style=\"height:48px;object-fit:contain\" onerror=\"this.style.display=\\'none\\'\" />' +" + "\n" + \
             "    '<div class=\"hl\">DEFTERDAR MUHASEBE<small>Kurban Belgesi &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +" + "\n" + \
             "    '</div>' +" + "\n" + \
             "    '<div style=\"display:flex;flex-direction:column;align-items:flex-end;gap:4px\">' +" + "\n" + \
             "    '<img src=\"cad.png\" style=\"height:48px;object-fit:contain\" onerror=\"this.style.display=\\'none\\'\" />' +" + "\n" + \
             "    '<div style=\"font-size:11px;color:#555;text-align:right\">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +" + "\n" + \
             "    '</div>' +" + "\n" + \
             "    '</div>' +"

if old_header in c:
    c = c.replace(old_header, new_header)
    print('kurbanYazdirHTML header REPLACED')
else:
    print('kurbanYazdirHTML header NOT FOUND - trying partial')
    # Daha basit yaklaşım: footer'ı bul ve header'ı da değiştir
    # kurbanYazdirHTML içindeki header kısmını bul
    idx = c.find("'<div class=\"header\">' +")
    if idx > 0:
        print(f'Found at index {idx}')
        print(repr(c[idx:idx+300]))

# ── yazdirilabilirHTML footer güncelle
old_f2 = "    '<div class=\"footer\"><span>Defterdar Muhasebe &mdash; CMS Team</span><span>Founder: Ismail DEMIRCAN</span></div>' +"
new_f2 = "    '<div class=\"footer\"><span>Defterdar Muhasebe &mdash; CMS Team</span></div>' +"
c = c.replace(old_f2, new_f2)

# ── yazdirilabilirHTML header güncelle
old_h2 = "    '<div class=\"header\">' +" + "\n" + \
         "    '<div class=\"header-left\">DEFTERDAR MUHASEBE<small>' + baslik + ' &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +" + "\n" + \
         "    '<div style=\"font-size:12px;color:#555;text-align:right\">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +" + "\n" + \
         "    '</div>' +"

new_h2 = "    '<div class=\"header\">' +" + "\n" + \
         "    '<div style=\"display:flex;align-items:center;gap:10px\">' +" + "\n" + \
         "    '<img src=\"icder.png\" style=\"height:48px;object-fit:contain\" onerror=\"this.style.display=\\'none\\'\" />' +" + "\n" + \
         "    '<div class=\"header-left\">DEFTERDAR MUHASEBE<small>' + baslik + ' &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +" + "\n" + \
         "    '</div>' +" + "\n" + \
         "    '<div style=\"display:flex;flex-direction:column;align-items:flex-end;gap:4px\">' +" + "\n" + \
         "    '<img src=\"cad.png\" style=\"height:48px;object-fit:contain\" onerror=\"this.style.display=\\'none\\'\" />' +" + "\n" + \
         "    '<div style=\"font-size:12px;color:#555;text-align:right\">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +" + "\n" + \
         "    '</div>' +" + "\n" + \
         "    '</div>' +"

if old_h2 in c:
    c = c.replace(old_h2, new_h2)
    print('yazdirilabilirHTML header REPLACED')
else:
    print('yazdirilabilirHTML header NOT FOUND')

# ── yazdirBagiscilar footer güncelle
old_fb = "    '<div class=\"footer\"><span>Defterdar Muhasebe &mdash; CMS Team</span><span>Founder: Ismail DEMIRCAN</span></div>' +"
new_fb = "    '<div class=\"footer\"><span>Defterdar Muhasebe &mdash; CMS Team</span></div>' +"
c = c.replace(old_fb, new_fb)

# ── yazdirBagiscilar header güncelle
old_hb = "    '<div class=\"header\">' +" + "\n" + \
         "    '<div class=\"hl\">DEFTERDAR MUHASEBE<small>Bagisci Listesi &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +" + "\n" + \
         "    '<div style=\"font-size:11px;color:#555;text-align:right\">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +" + "\n" + \
         "    '</div>' +"

new_hb = "    '<div class=\"header\">' +" + "\n" + \
         "    '<div style=\"display:flex;align-items:center;gap:10px\">' +" + "\n" + \
         "    '<img src=\"icder.png\" style=\"height:48px;object-fit:contain\" onerror=\"this.style.display=\\'none\\'\" />' +" + "\n" + \
         "    '<div class=\"hl\">DEFTERDAR MUHASEBE<small>Bagisci Listesi &mdash; ' + new Date().toLocaleDateString('tr-TR') + '</small></div>' +" + "\n" + \
         "    '</div>' +" + "\n" + \
         "    '<div style=\"display:flex;flex-direction:column;align-items:flex-end;gap:4px\">' +" + "\n" + \
         "    '<img src=\"cad.png\" style=\"height:48px;object-fit:contain\" onerror=\"this.style.display=\\'none\\'\" />' +" + "\n" + \
         "    '<div style=\"font-size:11px;color:#555;text-align:right\">Organizasyon: <strong>' + esc(S.orgAd) + '</strong><br>' + S.orgYil + '</div>' +" + "\n" + \
         "    '</div>' +" + "\n" + \
         "    '</div>' +"

if old_hb in c:
    c = c.replace(old_hb, new_hb)
    print('yazdirBagiscilar header REPLACED')
else:
    print('yazdirBagiscilar header NOT FOUND')

# ── Tüm "Founder: Ismail DEMIRCAN" ifadelerini kaldır
c = c.replace('Founder: Ismail DEMIRCAN', '')
c = c.replace('Founder. Ismail DEMIRCAN', '')
c = c.replace('&nbsp;&mdash;&nbsp; Founder. Ismail DEMIRCAN', '')

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('DONE')
