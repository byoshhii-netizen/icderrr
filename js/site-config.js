/* ============================================
   ICDER – Site Konfigürasyonu
   Admin panelinden düzenlenebilir bilgiler
   ============================================ */

const SiteConfig = {

  DEFAULTS: {
    telefon: '0850 305 18 55',
    whatsapp: '905403051855',
    email: 'bilgi@icder.org',
    adres: 'Hasköy Mah. Bozkır Sokak No:49 Canik / Samsun',
    facebook: 'https://www.facebook.com/icdertr',
    twitter: 'https://x.com/icderorg',
    instagram: 'https://www.instagram.com/icderorg',
    youtube: 'https://www.youtube.com/icderorg',
    sitAdi: 'İslam Çınarı Derneği',
    slogan: 'Bir Çınar Gibi Kök Sal, Gölge Ver',
    heroAlt: 'İÇDER olarak Türkiye, Afrika, Asya ve Ortadoğu\'da ihtiyaç sahiplerine ulaşıyor, kalıcı iyilik projeleri üretiyoruz.'
  },

  get() {
    try {
      const saved = JSON.parse(localStorage.getItem('icder_site_config') || '{}');
      return { ...this.DEFAULTS, ...saved };
    } catch { return { ...this.DEFAULTS }; }
  },

  async getFromServer() {
    try {
      const r = await fetch('/api/config');
      if (r.ok) {
        const data = await r.json();
        // localStorage'a da yaz
        localStorage.setItem('icder_site_config', JSON.stringify(data));
        return { ...this.DEFAULTS, ...data };
      }
    } catch {}
    return this.get();
  },

  async save(config) {
    // Sunucuya kaydet
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch {}
    // localStorage'a da yaz
    localStorage.setItem('icder_site_config', JSON.stringify(config));
  },

  // Sayfadaki tüm dinamik alanları güncelle
  applyToPage(cfg) {
    // Telefon
    document.querySelectorAll('[data-cfg="telefon"]').forEach(el => {
      el.textContent = cfg.telefon;
      if (el.tagName === 'A') el.href = 'tel:+9' + cfg.telefon.replace(/\s/g,'');
    });
    // Email
    document.querySelectorAll('[data-cfg="email"]').forEach(el => {
      el.textContent = cfg.email;
      if (el.tagName === 'A') el.href = 'mailto:' + cfg.email;
    });
    // Adres
    document.querySelectorAll('[data-cfg="adres"]').forEach(el => {
      el.textContent = cfg.adres;
    });
    // Sosyal medya
    document.querySelectorAll('[data-cfg="facebook"]').forEach(el => el.href = cfg.facebook);
    document.querySelectorAll('[data-cfg="twitter"]').forEach(el => el.href = cfg.twitter);
    document.querySelectorAll('[data-cfg="instagram"]').forEach(el => el.href = cfg.instagram);
    document.querySelectorAll('[data-cfg="youtube"]').forEach(el => el.href = cfg.youtube);
    document.querySelectorAll('[data-cfg="whatsapp"]').forEach(el => el.href = 'https://wa.me/' + cfg.whatsapp);
  }
};

window.SiteConfig = SiteConfig;

// Sayfa yüklenince uygula
document.addEventListener('DOMContentLoaded', async () => {
  const cfg = await SiteConfig.getFromServer();
  SiteConfig.applyToPage(cfg);
});
