// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ============ DONATE TABS ============
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ============ DONATE AMOUNTS ============
document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('donateAmount');
    if (input) input.value = btn.dataset.amount;
  });
});

// ============ FAQ ACCORDION ============
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const icon = btn.querySelector('i');
  const isOpen = answer.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question i').forEach(i => {
    i.classList.remove('fa-minus');
    i.classList.add('fa-plus');
    i.style.transform = 'rotate(0deg)';
  });

  if (!isOpen) {
    answer.classList.add('open');
    icon.classList.remove('fa-plus');
    icon.classList.add('fa-minus');
    icon.style.transform = 'rotate(180deg)';
  }
}

// ============ VIDEO MODAL ============
function openVideo() {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  if (modal && frame) {
    // Yerel MP4 dosyasını oynat
    frame.src = '';
    // iframe yerine video elementi kullan
    const box = document.querySelector('.modal-box');
    box.innerHTML = `
      <button class="modal-close" onclick="closeVideo()"><i class="fa fa-times"></i></button>
      <video id="tanitimVideo" controls autoplay style="width:100%;display:block;border-radius:0 0 12px 12px;">
        <source src="tanitimvideo.mp4" type="video/mp4">
        Tarayıcınız video oynatmayı desteklemiyor.
      </video>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeVideo() {
  const modal = document.getElementById('videoModal');
  if (modal) {
    // Video varsa durdur
    const vid = document.getElementById('tanitimVideo');
    if (vid) vid.pause();
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Modal box'ı sıfırla
    const box = document.querySelector('.modal-box');
    if (box) {
      box.innerHTML = `
        <button class="modal-close" onclick="closeVideo()"><i class="fa fa-times"></i></button>
        <iframe id="videoFrame" src="" allowfullscreen></iframe>
      `;
    }
  }
}

// ============ NAVBAR SCROLL SHADOW ============
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,.15)';
    } else {
      navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,.1)';
    }
  }
});

// ============ ANIMATE ON SCROLL ============
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.stat-item, .cat-card, .project-card, .news-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
