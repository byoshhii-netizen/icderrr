with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Tüm yazdırma HTML'lerinde resim src'lerini tam URL yap
c = c.replace('src="icder.png"', 'src="http://127.0.0.1:4500/icder.png"')
c = c.replace('src="cad.png"', 'src="http://127.0.0.1:4500/cad.png"')

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)
print('DONE')
