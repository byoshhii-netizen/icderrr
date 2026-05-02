/* ============================================
   İÇDER – Bağış SPA Router
   Route'lar: /bagis, /bagis/kurban, /bagis/genel,
   /bagis/su-kuyusu, /bagis/acil-yardim,
   /bagis/projeler, /bagis/saglik, /bagis/egitim
   ============================================ */

// ---- VERİ ----
const BAGIS_DATA = {
  kurban: {
    title: 'Kurban',
    desc: 'Kurban Bayramı\'nda ihtiyaç sahiplerine ulaşın. Büyükbaş, küçükbaş ve hisse seçenekleri mevcuttur.',
    icon: 'fa-moon',
    amounts: [1000, 2500, 5000, 10000],
    defaultAmount: 2500,
    items: [
      { id: 'k1', title: 'Büyükbaş Kurban', desc: 'Tam büyükbaş kurban – Afrika / Ortadoğu', price: 5000, progress: 72, target: '500 kurban', badge: 'Aktif', bg: 'kurban-bg' },
      { id: 'k2', title: 'Küçükbaş Kurban', desc: 'Tam küçükbaş kurban – Afrika / Ortadoğu', price: 2500, progress: 60, target: '300 kurban', badge: 'Aktif', bg: 'kurban-bg' },
      { id: 'k3', title: 'Büyükbaş Hisse (1/7)', desc: 'Büyükbaş kurban hissesi', price: 1000, progress: 85, target: '1000 hisse', badge: 'Aktif', bg: 'kurban-bg' },
      { id: 'k4', title: 'Adak / Şükür Kurbanı', desc: 'Adak ve şükür kurbanı', price: 750, progress: 40, target: '200 kurban', badge: 'Aktif', bg: 'kurban-bg' },
      { id: 'k5', title: 'Akika Kurbanı', desc: 'Yeni doğan için akika kurbanı', price: 2500, progress: 30, target: '100 kurban', badge: 'Aktif', bg: 'kurban-bg' },
      { id: 'k6', title: 'Gazze Kurban', desc: 'Gazze\'deki kardeşlerimiz için kurban', price: 2500, progress: 90, target: '200 kurban', badge: 'Acil', bg: 'acil-bg' },
    ]
  },
  genel: {
    title: 'Genel Bağış',
    desc: 'En çok ihtiyaç duyulan alanlara aktarılmak üzere genel bağış yapabilirsiniz.',
    icon: 'fa-hand-holding-heart',
    amounts: [100, 250, 500, 1000],
    defaultAmount: 250,
    items: [
      { id: 'g1', title: 'Genel Yardım', desc: 'En acil ihtiyaç alanlarına yönlendirilir', price: 100, progress: 65, target: 'Süregelen', badge: 'Aktif', bg: 'genel-bg' },
      { id: 'g2', title: 'Ramazan Yardımı', desc: 'Ramazan ayında ihtiyaç sahiplerine destek', price: 250, progress: 78, target: 'Süregelen', badge: 'Aktif', bg: 'genel-bg' },
      { id: 'g3', title: 'Fitre / Zekat', desc: 'Zekat ve fitrelerinizi doğru ellere ulaştırın', price: 150, progress: 55, target: 'Süregelen', badge: 'Aktif', bg: 'genel-bg' },
      { id: 'g4', title: 'Sadaka-i Cariye', desc: 'Kalıcı hayır projelerine destek', price: 500, progress: 42, target: 'Süregelen', badge: 'Aktif', bg: 'genel-bg' },
    ]
  },
  'su-kuyusu': {
    title: 'Su Kuyusu',
    desc: 'Afrika\'da temiz suya erişimi olmayan köylere su kuyusu açıyoruz.',
    icon: 'fa-droplet',
    amounts: [500, 1000, 5000, 10000],
    defaultAmount: 1000,
    items: [
      { id: 's1', title: 'El Kuyusu', desc: 'Küçük köyler için el kuyusu', price: 5000, progress: 45, target: '50 kuyu', badge: 'Aktif', bg: 'su-bg' },
      { id: 's2', title: 'Motorlu Kuyu', desc: 'Büyük köyler için motorlu su kuyusu', price: 15000, progress: 30, target: '20 kuyu', badge: 'Aktif', bg: 'su-bg' },
      { id: 's3', title: 'Kuyu Hissesi', desc: 'Su kuyusu projesine hisse ile katıl', price: 1000, progress: 70, target: '500 hisse', badge: 'Aktif', bg: 'su-bg' },
      { id: 's4', title: 'Su Deposu', desc: 'Köy için su deposu inşaatı', price: 8000, progress: 20, target: '10 depo', badge: 'Aktif', bg: 'su-bg' },
      { id: 's5', title: 'Çad Su Kuyusu', desc: 'Çad\'daki köylere temiz su', price: 5000, progress: 55, target: '30 kuyu', badge: 'Aktif', bg: 'su-bg' },
      { id: 's6', title: 'Somali Su Kuyusu', desc: 'Somali\'deki kuraklık bölgelerine su', price: 5000, progress: 38, target: '25 kuyu', badge: 'Aktif', bg: 'su-bg' },
    ]
  },
  'acil-yardim': {
    title: 'Acil Yardım',
    desc: 'Savaş, çatışma ve doğal afet bölgelerindeki kardeşlerimize acil destek.',
    icon: 'fa-kit-medical',
    amounts: [100, 250, 500, 1000],
    defaultAmount: 250,
    items: [
      { id: 'a1', title: 'Gazze Acil Yardım', desc: 'Gazze\'deki kardeşlerimize gıda ve ilaç', price: 250, progress: 88, target: 'Süregelen', badge: 'Acil', bg: 'acil-bg' },
      { id: 'a2', title: 'Suriye Yardımı', desc: 'Suriye\'deki mülteci ailelere destek', price: 200, progress: 65, target: 'Süregelen', badge: 'Acil', bg: 'acil-bg' },
      { id: 'a3', title: 'Yemen Yardımı', desc: 'Yemen\'deki insani kriz için destek', price: 200, progress: 50, target: 'Süregelen', badge: 'Acil', bg: 'acil-bg' },
      { id: 'a4', title: 'Afet Yardımı', desc: 'Deprem ve sel bölgelerine acil destek', price: 300, progress: 40, target: 'Süregelen', badge: 'Acil', bg: 'acil-bg' },
      { id: 'a5', title: 'Gıda Paketi', desc: 'Bir aileye aylık gıda paketi', price: 500, progress: 72, target: '1000 aile', badge: 'Acil', bg: 'acil-bg' },
      { id: 'a6', title: 'Tıbbi Malzeme', desc: 'İlaç ve tıbbi malzeme desteği', price: 350, progress: 60, target: 'Süregelen', badge: 'Acil', bg: 'acil-bg' },
    ]
  },
  projeler: {
    title: 'Projeler',
    desc: 'Uzun vadeli ve kalıcı etki yaratan projelerimize destek olun.',
    icon: 'fa-building-columns',
    amounts: [250, 500, 1000, 5000],
    defaultAmount: 500,
    items: [
      { id: 'p1', title: 'Çocuklar Gülsün', desc: 'Afrika Çad\'da 500 yetim çocuğa destek', price: 150, progress: 55, target: '500 çocuk', badge: 'Aktif', bg: 'proje-bg' },
      { id: 'p2', title: 'Yetim Sponsorluğu', desc: 'Bir yetim çocuğa aylık sponsor ol', price: 500, progress: 68, target: '200 yetim', badge: 'Aktif', bg: 'proje-bg' },
      { id: 'p3', title: 'Okul İnşaatı', desc: 'Afrika\'da okul inşaatına destek', price: 1000, progress: 35, target: '5 okul', badge: 'Aktif', bg: 'proje-bg' },
      { id: 'p4', title: 'Cami İnşaatı', desc: 'İhtiyaç bölgelerine cami inşaatı', price: 2000, progress: 25, target: '3 cami', badge: 'Aktif', bg: 'proje-bg' },
    ]
  },
  saglik: {
    title: 'Sağlık',
    desc: 'Sağlık hizmetlerine erişimi olmayan bölgelere tıbbi destek sağlıyoruz.',
    icon: 'fa-heart-pulse',
    amounts: [100, 250, 500, 1000],
    defaultAmount: 250,
    items: [
      { id: 'sa1', title: 'Tıbbi Malzeme', desc: 'İlaç ve tıbbi malzeme desteği', price: 250, progress: 60, target: 'Süregelen', badge: 'Aktif', bg: 'saglik-bg' },
      { id: 'sa2', title: 'Ameliyat Desteği', desc: 'Ameliyat masraflarına katkı', price: 1000, progress: 45, target: '50 ameliyat', badge: 'Aktif', bg: 'saglik-bg' },
      { id: 'sa3', title: 'Tekerlekli Sandalye', desc: 'Engelli kardeşlerimize tekerlekli sandalye', price: 500, progress: 70, target: '100 adet', badge: 'Aktif', bg: 'saglik-bg' },
      { id: 'sa4', title: 'Sünnet Kampanyası', desc: 'İhtiyaç sahibi çocuklara sünnet desteği', price: 300, progress: 55, target: '200 çocuk', badge: 'Aktif', bg: 'saglik-bg' },
    ]
  },
  egitim: {
    title: 'Eğitim',
    desc: 'Çocukların eğitimine destek olun. Okul malzemeleri, burs ve eğitim altyapısı.',
    icon: 'fa-book-open',
    amounts: [150, 300, 500, 1000],
    defaultAmount: 300,
    items: [
      { id: 'e1', title: 'Okul Çantası', desc: 'Yetim çocuğa okul çantası ve kırtasiye', price: 150, progress: 65, target: '500 çocuk', badge: 'Aktif', bg: 'egitim-bg' },
      { id: 'e2', title: 'Burs Desteği', desc: 'Öğrenciye aylık burs desteği', price: 500, progress: 50, target: '100 öğrenci', badge: 'Aktif', bg: 'egitim-bg' },
      { id: 'e3', title: 'Okul İnşaatı', desc: 'Afrika\'da okul inşaatına destek', price: 1000, progress: 35, target: '5 okul', badge: 'Aktif', bg: 'egitim-bg' },
      { id: 'e4', title: 'Tablet / Bilgisayar', desc: 'Öğrencilere dijital araç desteği', price: 800, progress: 40, target: '200 adet', badge: 'Aktif', bg: 'egitim-bg' },
      { id: 'e5', title: 'Kütüphane', desc: 'Köy okuluna kütüphane kurulumu', price: 2000, progress: 20, target: '10 kütüphane', badge: 'Aktif', bg: 'egitim-bg' },
      { id: 'e6', title: 'Yurt Desteği', desc: 'Öğrenci yurdu masraflarına katkı', price: 600, progress: 55, target: '50 öğrenci', badge: 'Aktif', bg: 'egitim-bg' },
    ]
  }
};

// ---- ROUTER ----
class BagisRouter {
  constructor() {
    this.content = document.getElementById('bagisContent');
    this.tabbar = document.getElementById('bagisTabbar');
    this.selectedItem = null;
    this.selectedAmount = null;

    if (!this.content) return;

    this.init();
  }

  init() {
    // Intercept tab clicks
    this.tabbar.querySelectorAll('.bagis-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = tab.dataset.cat;
        history.pushState({ cat }, '', `/bagis/${cat}`);
        this.render(cat);
      });
    });
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const route = this.getCatFromPath();
      if (route.isDetay) this.renderDetay(route.cat, route.itemId);
      else this.render(route.cat);
    });

    // Initial render
    const route = this.getCatFromPath();
    if (route.isDetay) this.renderDetay(route.cat, route.itemId);
    else this.render(route.cat);
  }

  getCatFromPath() {
    const path = window.location.pathname;
    // /bagis/kurban/k1 → detay
    const detayMatch = path.match(/\/bagis\/([^/]+)\/([^/]+)/);
    if (detayMatch) return { cat: detayMatch[1], itemId: detayMatch[2], isDetay: true };
    // /bagis/kurban → kategori
    const catMatch = path.match(/\/bagis\/([^/]+)/);
    return catMatch ? { cat: catMatch[1], isDetay: false } : { cat: 'kurban', isDetay: false };
  }

  setActiveTab(cat) {
    this.tabbar.querySelectorAll('.bagis-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.cat === cat);
    });
  }

  render(cat) {
    const data = BAGIS_DATA[cat];
    if (!data) {
      this.render('kurban');
      return;
    }

    this.currentCat = cat;
    this.setActiveTab(cat);
    this.selectedItem = data.items[0];
    this.selectedAmount = data.defaultAmount;

    // Update page title
    document.title = `${data.title} Bağışı – İÇDER`;

    this.content.innerHTML = `
      <div class="bagis-inner">
        <div class="bagis-left">
          <div class="bagis-cat-header">
            <h2><i class="fa ${data.icon}" style="color:#2e7d32; margin-right:10px;"></i>${data.title}</h2>
            <p>${data.desc}</p>
          </div>
          <div class="bagis-cards" id="bagisCards">
            ${data.items.map(item => this.renderCard(item)).join('')}
          </div>
        </div>
        <div class="bagis-widget-sticky">
          ${this.renderWidget(data)}
        </div>
      </div>
    `;

    // Card click events
    this.content.querySelectorAll('.bagis-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.dataset.id;
        const item = data.items.find(i => i.id === itemId);
        if (!item) return;

        this.selectedItem = item;
        this.content.querySelectorAll('.bagis-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Update widget
        const nameEl = document.getElementById('widgetItemTitle');
        const priceEl = document.getElementById('widgetItemPrice');
        if (nameEl) nameEl.textContent = item.title;
        if (priceEl) priceEl.textContent = item.price.toLocaleString('tr-TR') + ' ₺';

        // Set amount
        this.setWidgetAmount(item.price);
      });
    });

    // Amount buttons
    this.content.querySelectorAll('.widget-amount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setWidgetAmount(parseInt(btn.dataset.amount));
      });
    });

    // Select first card
    const firstCard = this.content.querySelector('.bagis-card');
    if (firstCard) firstCard.classList.add('selected');
  }

  renderCard(item) {
    return `
      <div class="bagis-card" data-id="${item.id}" style="cursor:pointer;">
        <div class="bagis-card-img ${item.bg}" onclick="window.bagisRouter.openDetay('${this.currentCat}','${item.id}')">
          <span class="bagis-card-badge ${item.badge === 'Acil' ? 'acil' : ''}">${item.badge}</span>
          <div class="bagis-card-title-overlay">${item.title}</div>
        </div>
        <div class="bagis-card-body">
          <p>${item.desc}</p>
          <div class="bagis-card-progress">
            <div class="bagis-card-progress-bar">
              <div class="bagis-card-progress-fill" style="width:${item.progress}%"></div>
            </div>
            <div class="bagis-card-progress-info">
              <span>%${item.progress}</span>
              <span>${item.target}</span>
            </div>
          </div>
          <div class="bagis-card-footer">
            <span class="bagis-card-price">${item.price.toLocaleString('tr-TR')} ₺</span>
            <button class="bagis-card-btn" onclick="event.stopPropagation(); window.bagisRouter.secVeSepeteEkle('${this.currentCat}','${item.id}')">
              Seç <i class="fa fa-basket-shopping"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  secVeSepeteEkle(cat, itemId) {
    const data = BAGIS_DATA[cat];
    if (!data) return;
    const item = data.items.find(i => i.id === itemId);
    if (!item || !window.sepet) return;

    const amount = parseInt(document.getElementById('widgetAmount')?.value) || item.price;
    window.sepet.add({
      id: item.id,
      title: item.title,
      price: item.price,
      amount: amount,
      cat: data.title,
      icon: data.icon
    });
  }

  openDetay(cat, itemId) {
    const url = `/bagis/${cat}/${itemId}`;
    history.pushState({ cat, itemId }, '', url);
    this.renderDetay(cat, itemId);
  }

  renderWidget(data) {
    const first = data.items[0];
    return `
      <div class="bagis-widget">
        <h3>Bağış Yap</h3>
        <p class="widget-sub">Güvenli ödeme altyapısı</p>

        <div class="widget-selected-item">
          <div class="item-name">Seçilen</div>
          <div class="item-title" id="widgetItemTitle">${first.title}</div>
          <div style="font-size:20px; font-weight:800; color:#2e7d32; margin-top:4px;" id="widgetItemPrice">${first.price.toLocaleString('tr-TR')} ₺</div>
        </div>

        <div class="widget-amounts">
          ${data.amounts.map(a => `
            <button class="widget-amount-btn ${a === data.defaultAmount ? 'active' : ''}" data-amount="${a}">
              ${a.toLocaleString('tr-TR')} ₺
            </button>
          `).join('')}
          <button class="widget-amount-btn" data-amount="0" style="grid-column:span 2;">Diğer Tutar</button>
        </div>

        <div class="widget-input-wrap">
          <span class="currency">₺</span>
          <input type="number" id="widgetAmount" value="${data.defaultAmount}" placeholder="Tutar girin" />
        </div>

        <div class="widget-form-group">
          <input type="text" placeholder="Ad Soyad" />
        </div>
        <div class="widget-form-group">
          <input type="tel" placeholder="Telefon: 05XX XXX XX XX" />
        </div>

        <button class="widget-submit">
          BAĞIŞ YAP <i class="fa fa-arrow-right"></i>
        </button>
        <p class="widget-note"><i class="fa fa-lock"></i> 256-bit SSL şifreli güvenli ödeme</p>
      </div>

      <div style="background:#e8f5e9; border-radius:14px; padding:18px; margin-top:16px;">
        <h4 style="color:#1b5e20; font-weight:700; margin-bottom:8px; font-size:14px;">
          <i class="fa fa-building-columns"></i> Havale / EFT ile Bağış
        </h4>
        <p style="font-size:13px; color:#555; margin-bottom:8px;">Banka havalesi ile de bağış yapabilirsiniz.</p>
        <a href="/hesaplar" style="color:#2e7d32; font-weight:600; font-size:13px;">
          Hesap Numaralarını Gör <i class="fa fa-arrow-right"></i>
        </a>
      </div>
    `;
  }

  setWidgetAmount(amount) {
    const input = document.getElementById('widgetAmount');
    if (input && amount > 0) input.value = amount;

    this.content.querySelectorAll('.widget-amount-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.amount) === amount);
    });
  }

  renderDetay(cat, itemId) {
    const data = BAGIS_DATA[cat];
    if (!data) { this.render('kurban'); return; }
    const item = data.items.find(i => i.id === itemId);
    if (!item) { this.render(cat); return; }

    this.currentCat = cat;
    this.setActiveTab(cat);
    document.title = `${item.title} – İÇDER`;

    const iconMap = {
      'kurban-bg': '🐄', 'su-bg': '💧', 'acil-bg': '🚑',
      'egitim-bg': '📚', 'saglik-bg': '❤️', 'genel-bg': '🤲', 'proje-bg': '🏗️'
    };

    this.content.innerHTML = `
      <!-- DETAY HERO -->
      <div class="detay-hero">
        <div class="detay-hero-inner">
          <div class="detay-hero-text">
            <div class="breadcrumb" style="margin-bottom:14px; justify-content:flex-start;">
              <a href="/bagis" style="color:rgba(255,255,255,.7);" onclick="event.preventDefault(); history.back();">← Geri Dön</a>
              <span style="color:rgba(255,255,255,.5);">/</span>
              <a href="/bagis/${cat}" style="color:rgba(255,255,255,.7);" onclick="event.preventDefault(); history.pushState({},'',' /bagis/${cat}'); window.bagisRouter.render('${cat}');">${data.title}</a>
              <span style="color:rgba(255,255,255,.5);">/</span>
              <span style="color:#fff;">${item.title}</span>
            </div>
            <span class="badge">${item.badge}</span>
            <h1>${item.title}</h1>
            <p>${item.desc}</p>
          </div>
          <div class="detay-hero-img">${iconMap[item.bg] || '🤲'}</div>
        </div>
      </div>

      <!-- DETAY BODY -->
      <div class="detay-body">
        <div class="detay-inner">
          <!-- SOL: İçerik -->
          <div>
            <div class="detay-progress">
              <h4>Proje İlerlemesi</h4>
              <div class="progress-bar-wrap" style="margin-bottom:8px;">
                <div class="progress-bar" style="width:${item.progress}%"></div>
              </div>
              <div class="progress-info">
                <span>%${item.progress} tamamlandı</span>
                <span>Hedef: ${item.target}</span>
              </div>
              <div class="detay-stat-grid">
                <div class="detay-stat">
                  <div class="val">%${item.progress}</div>
                  <div class="lbl">Tamamlandı</div>
                </div>
                <div class="detay-stat">
                  <div class="val">${item.price.toLocaleString('tr-TR')} ₺</div>
                  <div class="lbl">Bağış Tutarı</div>
                </div>
                <div class="detay-stat">
                  <div class="val">${item.target}</div>
                  <div class="lbl">Hedef</div>
                </div>
              </div>
            </div>

            <div class="detay-content">
              <h2>${item.title} Hakkında</h2>
              <p>${item.desc} İÇDER ekipleri tarafından titizlikle yürütülen bu proje kapsamında bağışlarınız doğrudan ihtiyaç sahiplerine ulaştırılmaktadır.</p>
              <p>Tüm bağış süreçleri şeffaf biçimde yönetilmekte, fotoğraf ve video kayıtları arşivlenmektedir. Bağışçılarımıza düzenli olarak proje güncellemeleri iletilmektedir.</p>
              <p>Derneğimiz yardım faaliyetlerini başta Türkiye olmak üzere Afrika, Asya ve Ortadoğu'da yardıma muhtaç bütün kriz ve afet bölgelerinde yürütmektedir.</p>
            </div>
          </div>

          <!-- SAĞ: Widget -->
          <div class="detay-widget-sticky">
            <div class="bagis-widget">
              <h3>Bağış Yap</h3>
              <p class="widget-sub">Güvenli ödeme altyapısı</p>

              <div class="widget-selected-item">
                <div class="item-name">Seçilen Proje</div>
                <div class="item-title">${item.title}</div>
                <div style="font-size:20px; font-weight:800; color:#2e7d32; margin-top:4px;" id="detayPrice">${item.price.toLocaleString('tr-TR')} ₺</div>
              </div>

              <div class="widget-amounts">
                ${data.amounts.map(a => `
                  <button class="widget-amount-btn ${a === item.price ? 'active' : ''}"
                    data-amount="${a}"
                    onclick="document.getElementById('detayAmountInput').value=${a}; document.getElementById('detayPrice').textContent='${a.toLocaleString('tr-TR')} ₺'; document.querySelectorAll('.widget-amount-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">
                    ${a.toLocaleString('tr-TR')} ₺
                  </button>
                `).join('')}
                <button class="widget-amount-btn" style="grid-column:span 2;" onclick="document.getElementById('detayAmountInput').focus()">Diğer Tutar</button>
              </div>

              <div class="widget-input-wrap">
                <span class="currency">₺</span>
                <input type="number" id="detayAmountInput" value="${item.price}" placeholder="Tutar girin"
                  oninput="document.getElementById('detayPrice').textContent=parseInt(this.value||0).toLocaleString('tr-TR')+' ₺'" />
              </div>

              <div class="widget-form-group">
                <input type="text" placeholder="Ad Soyad" />
              </div>
              <div class="widget-form-group">
                <input type="tel" placeholder="Telefon: 05XX XXX XX XX" />
              </div>

              <button class="widget-submit" onclick="
                const amt = parseInt(document.getElementById('detayAmountInput').value) || ${item.price};
                window.sepet && window.sepet.add({
                  id: '${item.id}',
                  title: '${item.title}',
                  price: ${item.price},
                  amount: amt,
                  cat: '${data.title}',
                  icon: '${data.icon}'
                });
              ">
                <i class="fa fa-basket-shopping"></i> Sepete Ekle
              </button>
              <p class="widget-note"><i class="fa fa-lock"></i> 256-bit SSL şifreli güvenli ödeme</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  window.bagisRouter = new BagisRouter();
});
