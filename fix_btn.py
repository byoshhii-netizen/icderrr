with open('public/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix broken backtick-quote in template literal
bad = "onclick=\"modalHisseler(${k.id},${k.kurban_no},`'${k.tur}`')\""
good = "onclick=\"modalHisseler(${k.id},${k.kurban_no},'${k.tur}')\""
c = c.replace(bad, good)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(c)
print('DONE')
