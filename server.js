const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'defterdar-cms-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 saat
}));

app.use('/api/auth', require('./src/auth'));
app.use('/api', require('./src/routes'));
app.use('/api/medya', require('./src/cloudinary'));

app.get('/giris', (req, res) => res.sendFile(path.join(__dirname, 'public', 'giris.html')));
app.get('/kayit', (req, res) => res.sendFile(path.join(__dirname, 'public', 'giris.html')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ ok: false });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Defterdar Muhasebe: http://localhost:${PORT}`);
  });
}
