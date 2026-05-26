/* ============================================
   İÇDER - Site İçerik Yönetimi
   Tüm görseller ve içerikler buradan yönetilir
   ============================================ */

const SiteContent = {
  
  // Varsayılan içerik yapısı
  DEFAULTS: {
    // Logo
    logo: 'icderyazi.png',
    
    // Hero Slider Görselleri
    heroSlider: [
      { id: 'hero1', src: 'gazze1.jpg', alt: 'Gazze Yardım 1', active: true },
      { id: 'hero2', src: 'gazze2.jpg', alt: 'Gazze Yardım 2', active: true },
      { id: 'hero3', src: 'gazze3.jpg', alt: 'Gazze Yardım 3', active: true },
      { id: 'hero4', src: 'gazze4.webp', alt: 'Gazze Yardım 4', active: true },
      { id: 'hero5', src: 'gazze5.jpg', alt: 'Gazze Yardım 5', active: true },
      { id: 'hero6', src: 'gazze6.webp', alt: 'Gazze Yardım 6', active: true }
    ],
    
    // Bağış Kategorileri İkonları
    categories: [
      { id: 'cat1', name: 'Kurban', icon: 'icon237.png', link: '/bagis/kurban' },
      { id: 'cat2', name: 'Zekat & Sadaka', icon: 'icon234.png', link: '/bagis/genel' },
      { id: 'cat3', name: 'Yurtdışı Yardımlar', icon: 'icon235.png', link: '/bagis/acil-yardim' },
      { id: 'cat4', name: 'Eğitim', icon: 'icon238.png', link: '/bagis/egitim' },
      { id: 'cat5', name: 'Yurtiçi Yardımlar', icon: 'icon236.png', link: '/bagis/saglik' },
      { id: 'cat6', name: 'Genel Bağış', icon: 'icon249.png', link: '/bagis/genel' }
    ],
    
    // Projeler
    projects: [
      {
        id: 'proj1',
        title: 'Kurban Bayramı 2026',
        desc: 'Afrika – Çad\'da kurban kesimlerini gerçekleştiriyoruz. Kurbanınızı ihtiyaç sahiplerine ulaştırın.',
        image: 'kurban1.png',
        progress: 72,
        target: '500 kurban',
        badge: 'Aktif',
        link: '/bagis/kurban'
      },
      {
        id: 'proj2',
        title: 'Gazze Yardım',
        desc: 'Gazze\'deki kardeşlerimize gıda, ilaç ve temel ihtiyaç malzemeleri ulaştırıyoruz.',
        image: 'filistin1.png',
        progress: 88,
        target: 'Süregelen yardım',
        badge: 'Acil',
        link: '/bagis/acil-yardim'
      },
      {
        id: 'proj3',
        title: 'Yetim Sponsorluğu',
        desc: 'Afrika\'daki yetim çocuklara aylık sponsor olun. Sadece 500 TL ile bir yetimin hayatına dokunun.',
        image: 'siyahcocuk.jpg',
        progress: 55,
        target: '200 yetim hedefi',
        badge: 'Devam Ediyor',
        link: '/bagis/projeler'
      }
    ],
    
    // Haberler
    news: [
      {
        id: 'news1',
        title: '2025 Kurbanların Kesimini Gerçekleştirdik',
        desc: 'Afrika – Çad\'da 2025 Kurban kesimlerini gerçekleştirdik. Bağışçılarımıza teşekkür ederiz.',
        image: 'gazze1.jpg',
        date: '01 Temmuz 2025',
        link: '/faaliyetler'
      },
      {
        id: 'news2',
        title: 'Sadece 150 TL ile Bir Yetimin Karnını Doyurabilirsiniz',
        desc: 'Afrika Çad\'da 500 yetim çocuğa umut olduk, sofralarına misafir olduk.',
        image: 'gazze2.jpg',
        date: '27 Mayıs 2025',
        link: '/faaliyetler'
      },
      {
        id: 'news3',
        title: 'Gazze\'de Ramazan Boyunca İftar Dağıtımı',
        desc: 'Ramazan ayı boyunca Gazze\'deki kardeşlerimize günlük iftar yemeği ulaştırdık.',
        image: 'gazze3.jpg',
        date: '15 Mart 2025',
        link: '/faaliyetler'
      },
      {
        id: 'news4',
        title: 'Gazze\'de Kesintisiz Sıcak Yemek Dağıtımı',
        desc: 'Gazze\'deki kardeşlerimize kesintisiz sıcak yemek dağıtım çalışmalarımız devam ediyor.',
        image: 'gazze4.webp',
        date: '09 Şubat 2025',
        link: '/faaliyetler'
      },
      {
        id: 'news5',
        title: 'İÇDER Gazze İçin Umut Olmaya Devam Ediyor',
        desc: 'Gazze\'deki insani kriz için yardım çalışmalarımız aralıksız sürmektedir.',
        image: 'gazze5.jpg',
        date: '17 Ocak 2025',
        link: '/faaliyetler'
      },
      {
        id: 'news6',
        title: 'Gazze\'ye Tıbbi Malzeme ve İlaç Desteği',
        desc: 'Gazze\'deki hastanelere ilaç, tıbbi malzeme ve serum desteği ulaştırdık.',
        image: 'gazze6.webp',
        date: '08 Ocak 2025',
        link: '/faaliyetler'
      }
    ]
  },

  // LocalStorage'dan içeriği al
  get() {
    try {
      const saved = JSON.parse(localStorage.getItem('icder_site_content') || '{}');
      return this.deepMerge(this.DEFAULTS, saved);
    } catch {
      return { ...this.DEFAULTS };
    }
  },

  // Sunucudan içeriği al
  async getFromServer() {
    try {
      const r = await fetch('/api/content');
      if (r.ok) {
        const data = await r.json();
        localStorage.setItem('icder_site_content', JSON.stringify(data));
        return this.deepMerge(this.DEFAULTS, data);
      }
    } catch {}
    return this.get();
  },

  // İçeriği kaydet
  async save(content) {
    try {
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
    } catch {}
    localStorage.setItem('icder_site_content', JSON.stringify(content));
  },

  // Deep merge helper
  deepMerge(target, source) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  },

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  },

  // Belirli bir içeriği güncelle
  async updateItem(section, id, data) {
    const content = await this.getFromServer();
    const index = content[section].findIndex(item => item.id === id);
    if (index >= 0) {
      content[section][index] = { ...content[section][index], ...data };
      await this.save(content);
      return true;
    }
    return false;
  },

  // Yeni içerik ekle
  async addItem(section, data) {
    const content = await this.getFromServer();
    if (!content[section]) content[section] = [];
    content[section].push(data);
    await this.save(content);
    return true;
  },

  // İçerik sil
  async deleteItem(section, id) {
    const content = await this.getFromServer();
    content[section] = content[section].filter(item => item.id !== id);
    await this.save(content);
    return true;
  }
};

window.SiteContent = SiteContent;
