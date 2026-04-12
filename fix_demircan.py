with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('Ismail DEMIRCAN', 'CMS Team')
c = c.replace('Founder: ', '')
c = c.replace('Founder. ', '')
with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)
print('DONE')
