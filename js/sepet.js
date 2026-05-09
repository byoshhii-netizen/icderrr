/* ============================================
   İÇDER – Sepet & Ödeme Sistemi
   ============================================ */

class Sepet {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('icder_sepet') || '[]');
    this.init();
  }

  init() {
    this.injectHTML();
    this.bindEvents();
    this.updateBadge();
  }

  injectHTML() {
    document.body.insertAdjacentHTML('beforeend', `
      <!-- SEPET OVERLAY -->
      <div class="sepet-overlay" id="sepetOverlay"></div>

      <!-- SEPET DRAWER -->
      <div class="sepet-drawer" id="sepetDrawer">
        <div class="sepet-header">
          <h3><i class="fa fa-basket-shopping"></i> Sepetim</h3>
          <button class="sepet-close" id="sepetClose"><i class="fa fa-times"></i></button>
        </div>
        <div class="sepet-body" id="sepetBody"></div>
        <div class="sepet-footer" id="sepetFooter"></div>
      </div>

      <!-- SEPET FAB BUTTON -->
      <div class="sepet-badge" id="sepetFab" title="Sepetim">
        <i class="fa fa-basket-shopping"></i>
        <span class="sepet-badge-count" id="sepetCount">0</span>
      </div>

      <!-- ÖDEME MODAL -->
      <div class="odeme-modal-overlay" id="odemeOverlay">
        <div class="odeme-modal" id="odemeModal">
          <div class="odeme-modal-header">
            <h3><i class="fa fa-lock" style="margin-right:8px;"></i>Güvenli Ödeme</h3>
            <button class="odeme-modal-close" id="odemeClose"><i class="fa fa-times"></i></button>
          </div>
          <div class="odeme-modal-body" id="odemeBody"></div>
        </div>
      </div>
    `);
  }

  bindEvents() {
    document.getElementById('sepetOverlay').addEventListener('click', () => this.closeSepet());
    document.getElementById('sepetClose').addEventListener('click', () => this.closeSepet());
    document.getElementById('sepetFab').addEventListener('click', () => this.openSepet());
    document.getElementById('odemeClose').addEventListener('click', () => this.closeOdeme());
    document.getElementById('odemeOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('odemeOverlay')) this.closeOdeme();
    });
  }

  // ---- SEPET ACTIONS ----
  add(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.amount = item.amount;
    } else {
      this.items.push({ ...item, qty: 1 });
    }
    this.save();
    this.updateBadge();
    this.renderSepet();
    this.openSepet();

    // Bounce animation on FAB
    const fab = document.getElementById('sepetFab');
    fab.style.transform = 'scale(1.3)';
    setTimeout(() => fab.style.transform = '', 300);
  }

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateBadge();
    this.renderSepet();
  }

  // Ödeme tamamlandıktan sonra sepeti temizle (sadece başarılı ödemede)
  clearAfterPayment() {
    this.items = [];
    this.save();
    this.updateBadge();
    this.renderSepet();
  }

  clear() {
    // Sepet kalıcıdır — sadece ödeme tamamlandığında clearAfterPayment() çağrılır
    // Manuel temizleme butonu kaldırıldı
  }

  total() {
    return this.items.reduce((sum, i) => sum + (i.amount || i.price), 0);
  }

  save() {
    localStorage.setItem('icder_sepet', JSON.stringify(this.items));
  }

  updateBadge() {
    const count = document.getElementById('sepetCount');
    const navCount = document.getElementById('navSepetCount');
    const n = this.items.length;

    if (count) {
      count.textContent = n;
      count.classList.toggle('visible', n > 0);
    }
    if (navCount) {
      navCount.textContent = n;
      navCount.style.display = n > 0 ? 'flex' : 'none';
    }
  }

  openSepet() {
    this.renderSepet();
    document.getElementById('sepetDrawer').classList.add('open');
    document.getElementById('sepetOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeSepet() {
    document.getElementById('sepetDrawer').classList.remove('open');
    document.getElementById('sepetOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  renderSepet() {
    const body = document.getElementById('sepetBody');
    const footer = document.getElementById('sepetFooter');

    if (this.items.length === 0) {
      body.innerHTML = `
        <div class="sepet-empty">
          <i class="fa fa-basket-shopping"></i>
          <p>Sepetiniz boş</p>
          <a href="/bagis" style="color:#2e7d32; font-weight:600; font-size:14px;">Bağış Yap →</a>
        </div>
      `;
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = `
      ${this.items.map(item => `
        <div class="sepet-item" data-id="${item.id}">
          <div class="sepet-item-icon"><i class="fa ${item.icon || 'fa-hand-holding-heart'}"></i></div>
          <div class="sepet-item-info">
            <h4>${item.title}</h4>
            <p>${item.cat || 'Bağış'}</p>
          </div>
          <div class="sepet-item-price">${(item.amount || item.price).toLocaleString('tr-TR')} ₺</div>
          <button class="sepet-item-remove" onclick="window.sepet.remove('${item.id}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `).join('')}

      <div class="sepet-total">
        <div class="sepet-total-row">
          <span>${this.items.length} bağış kalemi</span>
        </div>
        <div class="sepet-total-row">
          <span>Toplam</span>
          <span class="total-amount">${this.total().toLocaleString('tr-TR')} ₺</span>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-odeme" onclick="window.sepet.startOdeme()">
        <i class="fa fa-lock"></i> Ödemeye Geç
      </button>
    `;
  }

  // ---- ÖDEME ----
  startOdeme() {
    this.closeSepet();
    this.currentStep = 1;
    this.renderOdeme();
    document.getElementById('odemeOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeOdeme() {
    document.getElementById('odemeOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  renderOdeme() {
    const body = document.getElementById('odemeBody');
    body.innerHTML = `
      <!-- STEPS -->
      <div class="odeme-steps">
        <div class="odeme-step ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'done' : ''}" id="step1">
          <div class="odeme-step-num">${this.currentStep > 1 ? '<i class="fa fa-check"></i>' : '1'}</div>
          <div class="odeme-step-label">Bilgiler</div>
        </div>
        <div class="odeme-step ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'done' : ''}" id="step2">
          <div class="odeme-step-num">${this.currentStep > 2 ? '<i class="fa fa-check"></i>' : '2'}</div>
          <div class="odeme-step-label">Ödeme</div>
        </div>
        <div class="odeme-step ${this.currentStep >= 3 ? 'active' : ''}" id="step3">
          <div class="odeme-step-num">3</div>
          <div class="odeme-step-label">Tamamlandı</div>
        </div>
      </div>

      <!-- PANEL 1: KİŞİSEL BİLGİLER -->
      <div class="odeme-panel ${this.currentStep === 1 ? 'active' : ''}" id="panel1">
        <div class="odeme-ozet">
          ${this.items.map(i => `
            <div class="odeme-ozet-row">
              <span>${i.title}</span>
              <span>${(i.amount || i.price).toLocaleString('tr-TR')} ₺</span>
            </div>
          `).join('')}
          <div class="odeme-ozet-row">
            <span>Toplam</span>
            <span>${this.total().toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>

        <div class="odeme-form-row">
          <div class="odeme-form-group">
            <label>Ad</label>
            <input type="text" id="odAd" placeholder="Adınız" />
          </div>
          <div class="odeme-form-group">
            <label>Soyad</label>
            <input type="text" id="odSoyad" placeholder="Soyadınız" />
          </div>
        </div>
        <div class="odeme-form-group">
          <label>E-posta</label>
          <input type="email" id="odEmail" placeholder="ornek@mail.com" />
        </div>
        <div class="odeme-form-group">
          <label>Telefon</label>
          <input type="tel" id="odTel" placeholder="05XX XXX XX XX" />
        </div>

        <div class="odeme-nav">
          <button class="btn-ileri" onclick="window.sepet.goStep(2)">
            Devam Et <i class="fa fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- PANEL 2: KART BİLGİLERİ -->
      <div class="odeme-panel ${this.currentStep === 2 ? 'active' : ''}" id="panel2">

        <!-- KART ANİMASYONU -->
        <div class="kart-scene">
          <div class="kart-3d" id="kart3d">
            <!-- ÖN YÜZ -->
            <div class="kart-face kart-front">
              <div class="kart-logo">
                <img src="../icderyazi.png" alt="İÇDER" onerror="this.style.display='none'" />
                <div class="kart-chip">
                  <div class="kart-chip-line"></div>
                  <div class="kart-chip-line"></div>
                  <div class="kart-chip-line"></div>
                  <div class="kart-chip-line"></div>
                </div>
              </div>
              <div class="kart-number" id="kartNumDisplay">•••• •••• •••• ••••</div>
              <div class="kart-bottom">
                <div>
                  <div class="kart-holder-label">Kart Sahibi</div>
                  <div class="kart-holder-name" id="kartAdDisplay">AD SOYAD</div>
                </div>
                <div>
                  <div class="kart-expiry-label">Son Kullanma</div>
                  <div class="kart-expiry-val" id="kartSKTDisplay">MM/YY</div>
                </div>
                <div class="kart-network">
                  <div class="kart-network-circle"></div>
                  <div class="kart-network-circle"></div>
                </div>
              </div>
            </div>
            <!-- ARKA YÜZ -->
            <div class="kart-face kart-back">
              <div class="kart-stripe"></div>
              <div class="kart-cvv-wrap">
                <span class="kart-cvv-label">CVV</span>
                <div class="kart-cvv-box" id="kartCVVDisplay">•••</div>
              </div>
              <div class="kart-back-logo">
                <div class="kart-network">
                  <div class="kart-network-circle"></div>
                  <div class="kart-network-circle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- KART FORMU -->
        <div class="odeme-form-group">
          <label>Kart Numarası</label>
          <input type="text" id="kartNum" placeholder="0000 0000 0000 0000" maxlength="19"
            oninput="window.sepet.formatKartNum(this)"
            onfocus="window.sepet.kartFocus('front')" />
        </div>
        <div class="odeme-form-group">
          <label>Kart Üzerindeki Ad</label>
          <input type="text" id="kartAd" placeholder="AD SOYAD"
            oninput="window.sepet.updateKartAd(this.value)"
            onfocus="window.sepet.kartFocus('front')" />
        </div>
        <div class="odeme-form-row">
          <div class="odeme-form-group">
            <label>Son Kullanma Tarihi</label>
            <input type="text" id="kartSKT" placeholder="MM/YY" maxlength="5"
              oninput="window.sepet.formatSKT(this)"
              onfocus="window.sepet.kartFocus('front')" />
          </div>
          <div class="odeme-form-group">
            <label>CVV</label>
            <input type="text" id="kartCVV" placeholder="•••" maxlength="3"
              oninput="window.sepet.updateCVV(this.value)"
              onfocus="window.sepet.kartFocus('back')"
              onblur="window.sepet.kartFocus('front')" />
          </div>
        </div>

        <div class="odeme-nav">
          <button class="btn-geri" onclick="window.sepet.goStep(1)">
            <i class="fa fa-arrow-left"></i> Geri
          </button>
          <button class="btn-ileri" onclick="window.sepet.processOdeme()">
            <i class="fa fa-lock"></i> Ödemeyi Tamamla
          </button>
        </div>
      </div>

      <!-- PANEL 3: BAŞARILI -->
      <div class="odeme-panel ${this.currentStep === 3 ? 'active' : ''}" id="panel3">
        <div class="odeme-success">
          <div class="odeme-success-icon"><i class="fa fa-check"></i></div>
          <h3>Bağışınız Alındı!</h3>
          <p>Bağışınız için teşekkür ederiz. Allah kabul etsin. Makbuzunuz e-posta adresinize gönderilecektir.</p>
          <div style="background:#f9fbe7; border-radius:12px; padding:16px; margin-bottom:20px; text-align:left;">
            <div style="font-size:13px; color:#888; margin-bottom:8px;">Bağış Özeti</div>
            ${this.items.map(i => `
              <div style="display:flex; justify-content:space-between; font-size:14px; color:#333; padding:4px 0;">
                <span>${i.title}</span>
                <span style="font-weight:700; color:#1b5e20;">${(i.amount||i.price).toLocaleString('tr-TR')} ₺</span>
              </div>
            `).join('')}
            <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:800; color:#1b5e20; padding-top:8px; border-top:1px solid #e8f5e9; margin-top:8px;">
              <span>Toplam</span>
              <span>${this.total().toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
          <button class="btn-ileri" onclick="window.sepet.closeOdeme(); window.sepet.clearAfterPayment();">
            Tamam
          </button>
        </div>
      </div>
    `;
  }

  goStep(step) {
    this.currentStep = step;
    this.renderOdeme();
  }

  processOdeme() {
    const btn = document.querySelector('.btn-ileri');
    if (btn) {
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Isleniyor...';
      btn.disabled = true;
    }

    // Kullanici bilgilerini al
    const ad    = document.getElementById('odAd')?.value?.trim() || '';
    const soyad = document.getElementById('odSoyad')?.value?.trim() || '';
    const email = document.getElementById('odEmail')?.value?.trim() || '';
    const tel   = document.getElementById('odTel')?.value?.trim() || '';

    setTimeout(() => {
      // Kullanici kaydet / bul
      let user = null;
      if (window.BagisDB && ad) {
        user = BagisDB.kullaniciKaydet(ad, soyad, tel, email);
        BagisDB.girisYap(user.kullaniciAdi);
      }

      // Her sepet itemini DB'ye kaydet
      if (window.BagisDB) {
        this.items.forEach(item => {
          BagisDB.kaydet({
            kullaniciAdi: user?.kullaniciAdi || '',
            ad, soyad, tel, email,
            tur: item.cat || item.title,
            baslik: item.title,
            tutar: item.amount || item.price,
          });
        });
      }

      this.goStep(3);
    }, 1800);
  }

  // ---- KART ANİMASYONLARI ----
  kartFocus(side) {
    const kart = document.getElementById('kart3d');
    if (!kart) return;
    if (side === 'back') {
      kart.classList.add('flipped');
    } else {
      kart.classList.remove('flipped');
    }
  }

  formatKartNum(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    input.value = val;
    const display = document.getElementById('kartNumDisplay');
    if (display) {
      const raw = val.replace(/\s/g, '');
      const masked = raw.padEnd(16, '•');
      display.textContent = masked.replace(/(.{4})/g, '$1 ').trim();
    }
  }

  updateKartAd(val) {
    const display = document.getElementById('kartAdDisplay');
    if (display) display.textContent = val.toUpperCase() || 'AD SOYAD';
  }

  formatSKT(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2);
    input.value = val;
    const display = document.getElementById('kartSKTDisplay');
    if (display) display.textContent = val || 'MM/YY';
  }

  updateCVV(val) {
    const display = document.getElementById('kartCVVDisplay');
    if (display) display.textContent = val ? '•'.repeat(val.length) : '•••';
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  window.sepet = new Sepet();
});
