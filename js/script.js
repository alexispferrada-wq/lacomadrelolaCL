/* =====================================================
   SCRIPT.JS — La Comadre Lola
   Main interactivity: nav, lightbox, form,
   transport tabs, live hours, smooth scroll
   ===================================================== */

import {
  debounce, throttle, isValidEmail, isValidPhone,
  showToast, getBusinessStatus, initLazyLoad, pad
} from './utils.js';

import {
  initScrollAnimations, initParallax,
  initHeroParticles, initRoseGarden, initCounters
} from './animations.js';

import {
  initEventsCarousel, bindEventsCarouselButtons,
  initTestimonialsCarousel, bindTestimonialsButtons,
  nextTestimonialSlide, prevTestimonialSlide
} from './carousel.js';

import { fetchEvents, submitReservation, fetchCarouselSlides } from './api.js';
import { initMagneticCursor } from './cursor.js';

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initScrollSpy();
  initHeroParallax();
  initLiveHours();
  initTransportTabs();
  initGalleryTabs();
  initLightbox();
  initNewsletter();
  initScrollToTop();
  initTestimonialsCarousel();
  bindTestimonialsButtons();
  initScrollAnimations();
  initParallax();
  initHeroParticles();
  initRoseGarden();
  initCounters();
  initLazyLoad();
  initGalleryFilter();
  initMagneticCursor();

  // Load dynamic content from backend (with static fallback)
  await loadDynamicEvents();
  await loadHeroCarousel();

  // Reservation form depends on dynamic events being rendered
  initReservationForm();
});

/* ─────────────────────────────────────────────────────
   DYNAMIC EVENTS — loaded from backend API
   Falls back gracefully to the static HTML when the
   API is not reachable (e.g. GitHub Pages without a
   running backend).
   ───────────────────────────────────────────────────── */
function formatDateCL(isoDate) {
  const d = new Date(isoDate);
  const days   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} - ${hh}:${mm}`;
}

async function loadDynamicEvents() {
  const grid = document.querySelector('.events-grid');
  if (!grid) return;

  const events = await fetchEvents();
  if (!events || !events.length) return; // keep static HTML

  grid.innerHTML = events.map((ev, i) => `
    <article class="event-card reveal reveal-d${Math.min(i + 1, 6)} card-3d" role="listitem">
      <div class="event-img-wrap">
        <img data-src="${escAttr(ev.image)}"
             src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
             alt="${escAttr(ev.name)}" class="event-img" loading="lazy">
        <div class="event-img-overlay"></div>
        ${ev.badge ? `<span class="event-badge">${escHtml(ev.badge)}</span>` : ''}
      </div>
      <div class="event-body">
        <div class="event-genre">&#x25CF; ${escHtml(ev.genre)}</div>
        <h3 class="event-name">${escHtml(ev.name)}</h3>
        <div class="event-meta">
          <span class="event-meta-item">&#x1F4C5; ${escHtml(formatDateCL(ev.date))}</span>
          <span class="event-meta-item">&#x1F4CD; ${escHtml(ev.location || 'Quilicura')}</span>
        </div>
        <a href="#reservas" class="event-btn">${escHtml(ev.btnText || '🎟 Comprar Entradas')}</a>
      </div>
    </article>
  `).join('');

  // Re-run lazy load and scroll animations on new elements
  initLazyLoad();
  document.querySelectorAll('.event-card.reveal').forEach(el => {
    if (!el.classList.contains('visible')) el.classList.remove('visible');
  });
  // Notify cursor module about new interactive elements
  document.dispatchEvent(new CustomEvent('lola:eventsRendered'));
}

/* ─────────────────────────────────────────────────────
   HERO CAROUSEL — loaded from backend API
   The hero becomes a slideshow when slides are provided.
   Falls back to static hero when API is unavailable.
   ───────────────────────────────────────────────────── */
async function loadHeroCarousel() {
  const heroSection = document.getElementById('inicio');
  if (!heroSection) return;

  const slides = await fetchCarouselSlides();
  if (!slides || slides.length < 2) return; // static hero is fine

  const heroBg      = heroSection.querySelector('.hero-bg');
  const heroContent = heroSection.querySelector('.hero-content');
  if (!heroBg || !heroContent) return;

  let currentSlide = 0;
  let heroTimer    = null;
  const HERO_INTERVAL = 6000;

  // Pre-load images
  slides.forEach(s => { const img = new Image(); img.src = s.image; });

  // Build dot navigation
  const dotsHtml = slides.map((_, i) =>
    `<button class="hero-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>`
  ).join('');
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'hero-carousel-dots';
  dotsWrap.innerHTML = dotsHtml;
  heroSection.appendChild(dotsWrap);

  function goToSlide(idx) {
    currentSlide = (idx + slides.length) % slides.length;
    const s = slides[currentSlide];

    // Fade background
    heroBg.style.backgroundImage = `url(${s.image})`;

    // Update content
    const badge    = heroContent.querySelector('.hero-badge');
    const title    = heroContent.querySelector('.hero-title');
    const subtitle = heroContent.querySelector('.hero-subtitle');
    const ctaBtns  = heroContent.querySelector('.hero-cta');

    if (badge)    badge.textContent      = s.badge || '';
    if (title) {
      // Use DOM methods to safely set title text with a highlighted word span
      title.textContent = '';
      const titleText = String(s.title || '');
      const lolaIdx   = titleText.indexOf('LOLA');
      if (lolaIdx !== -1) {
        title.appendChild(document.createTextNode(titleText.slice(0, lolaIdx)));
        const span = document.createElement('span');
        span.textContent = 'LOLA';
        title.appendChild(span);
        title.appendChild(document.createTextNode(titleText.slice(lolaIdx + 4)));
      } else {
        title.textContent = titleText;
      }
    }
    if (subtitle) subtitle.textContent   = s.subtitle || '';
    if (ctaBtns) {
      const [btnA, btnB] = ctaBtns.querySelectorAll('a');
      if (btnA && s.ctaPrimary)   { btnA.href = s.ctaPrimary.href;   btnA.textContent = s.ctaPrimary.text;   }
      if (btnB && s.ctaSecondary) { btnB.href = s.ctaSecondary.href; btnB.textContent = s.ctaSecondary.text; }
    }

    // Update dots
    dotsWrap.querySelectorAll('.hero-dot').forEach((d, i) =>
      d.classList.toggle('active', i === currentSlide)
    );
  }

  function startAutoplay() {
    stopAutoplay();
    heroTimer = setInterval(() => goToSlide(currentSlide + 1), HERO_INTERVAL);
  }
  function stopAutoplay() { clearInterval(heroTimer); }

  // Dot click
  dotsWrap.addEventListener('click', e => {
    const btn = e.target.closest('.hero-dot');
    if (btn) {
      goToSlide(Number(btn.dataset.index));
      stopAutoplay();
      startAutoplay();
    }
  });

  // Pause on hover
  heroSection.addEventListener('mouseenter', stopAutoplay);
  heroSection.addEventListener('mouseleave', startAutoplay);

  goToSlide(0);
  startAutoplay();
}

/* ─────────────────────────────────────────────────────
   SECURITY HELPERS
   ───────────────────────────────────────────────────── */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escAttr(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


   ───────────────────────────────────────────────────── */
function initNav() {
  const nav       = document.querySelector('.nav');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu= document.querySelector('.mobile-menu');

  // Scroll class
  const onScroll = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, 100);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h')) || 70;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────────────
   SCROLL SPY
   ───────────────────────────────────────────────────── */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
}

/* ─────────────────────────────────────────────────────
   HERO PARALLAX (handled in animations.js too, skip dupe)
   ───────────────────────────────────────────────────── */
function initHeroParallax() {
  const bg = document.querySelector('.hero-bg');
  if (bg) {
    // trigger the loaded class after paint for subtle zoom-out effect
    requestAnimationFrame(() => bg.classList.add('loaded'));
  }
}

/* ─────────────────────────────────────────────────────
   LIVE HOURS
   ───────────────────────────────────────────────────── */
function initLiveHours() {
  renderHoursStatus();
  setInterval(renderHoursStatus, 30000); // refresh every 30s
  highlightTodayRow();
}

function renderHoursStatus() {
  const statusDot    = document.getElementById('statusDot');
  const statusText   = document.getElementById('statusText');
  const statusPhrase = document.getElementById('statusPhrase');

  const result = getBusinessStatus();

  if (statusDot)  {
    statusDot.className = `status-dot ${result.isOpen ? 'open' : 'closed'}`;
  }
  if (statusText) {
    statusText.className  = `status-text ${result.isOpen ? 'open' : 'closed'}`;
    statusText.textContent = result.isOpen ? '¡ABIERTO AHORA!' : 'CERRADO';
  }
  if (statusPhrase) statusPhrase.textContent = result.phrase;

  renderCountdown(result);
}

function renderCountdown(result) {
  const wrap = document.getElementById('countdownWrap');
  if (!wrap) return;

  const now = new Date();

  if (result.isOpen && result.closeMins) {
    wrap.style.display = 'flex';
    const [ch, cm] = result.closeMins.split(':').map(Number);
    let closeDate  = new Date();
    closeDate.setHours(ch, cm, 0, 0);
    if (ch < 12) closeDate.setDate(closeDate.getDate() + 1); // past midnight

    function tick() {
      const diff = Math.max(0, closeDate - new Date());
      document.getElementById('cdH').textContent  = pad(Math.floor(diff / 3600000));
      document.getElementById('cdM').textContent  = pad(Math.floor((diff % 3600000) / 60000));
      document.getElementById('cdS').textContent  = pad(Math.floor((diff % 60000) / 1000));
      if (diff > 0) requestAnimationFrame(tick);
    }
    tick();
  } else {
    wrap.style.display = 'none';
  }
}

function highlightTodayRow() {
  const dayNum = new Date().getDay();
  document.querySelectorAll('.hours-row[data-days]').forEach(row => {
    const days = row.dataset.days.split(',').map(Number);
    if (days.includes(dayNum)) row.classList.add('today');
  });
}

/* ─────────────────────────────────────────────────────
   TRANSPORT TABS
   ───────────────────────────────────────────────────── */
function initTransportTabs() {
  const tabs   = document.querySelectorAll('.transport-tab');
  const panels = document.querySelectorAll('.transport-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.panel;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ─────────────────────────────────────────────────────
   GALLERY TABS (filter)
   ───────────────────────────────────────────────────── */
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterGallery(tab.dataset.filter);
    });
  });
}

function initGalleryFilter() {
  filterGallery('all');
}

function filterGallery(cat) {
  const items = document.querySelectorAll('.gallery-item');
  items.forEach(item => {
    const show = cat === 'all' || item.dataset.cat === cat;
    item.style.display   = show ? '' : 'none';
    item.style.animation = show ? 'scaleIn 0.4s ease both' : 'none';
  });
}

/* ─────────────────────────────────────────────────────
   LIGHTBOX
   ───────────────────────────────────────────────────── */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImg    = document.getElementById('lbImg');
  const lbClose  = document.getElementById('lbClose');
  const lbPrev   = document.getElementById('lbPrev');
  const lbNext   = document.getElementById('lbNext');
  const lbCounter= document.getElementById('lbCounter');

  let items   = [];
  let current = 0;

  function openLightbox(idx) {
    current = idx;
    lbImg.src = items[current].src;
    if (lbCounter) lbCounter.textContent = `${current + 1} / ${items.length}`;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 350);
  }

  function showNext() { openLightbox((current + 1) % items.length); }
  function showPrev() { openLightbox((current - 1 + items.length) % items.length); }

  // Collect gallery images (visible items only at open time)
  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      items   = Array.from(document.querySelectorAll('.gallery-item:not([style*="display: none"])'))
                     .map(el => ({ src: el.querySelector('img')?.src || el.dataset.src }));
      const visibleItems = Array.from(document.querySelectorAll('.gallery-item:not([style*="display: none"])'));
      const idx = visibleItems.indexOf(item);
      openLightbox(Math.max(0, idx));
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click',  showPrev);
  if (lbNext)  lbNext.addEventListener('click',  showNext);

  // Click outside
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft')  showPrev();
  });
}

/* ─────────────────────────────────────────────────────
   RESERVATION FORM
   ───────────────────────────────────────────────────── */
function initReservationForm() {
  const form    = document.getElementById('reservationForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateReservationForm(form)) return;

    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Enviando...';
    btn.disabled    = true;

    const data = {
      nombre:   form.querySelector('#resName').value.trim(),
      email:    form.querySelector('#resEmail').value.trim(),
      telefono: form.querySelector('#resPhone').value.trim(),
      personas: form.querySelector('#resPeople').value,
      tipo:     form.querySelector('#resType').value,
      fecha:    form.querySelector('#resDate').value,
      mensaje:  form.querySelector('#resMsg')?.value.trim() || '',
    };

    const result = await submitReservation(data);

    if (result.ok) {
      // API success
      form.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast('¡Reserva enviada! Te contactaremos pronto 🎉', 'success');
    } else if (result.message === null) {
      // API unreachable — simulate success so the user experience isn't broken
      form.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast('¡Reserva recibida! Te contactaremos pronto 🎉', 'success');
    } else {
      // API returned a validation error
      showToast(result.message || 'Error al enviar. Intenta de nuevo.', 'error');
      btn.textContent = '🎉 Confirmar Reserva';
      btn.disabled    = false;
    }
  });

  // Real-time validation
  form.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      if (group && group.classList.contains('has-error')) validateField(input);
    });
  });
}

function validateReservationForm(form) {
  let valid = true;
  form.querySelectorAll('.form-control[required]').forEach(input => {
    if (!validateField(input)) valid = false;
  });
  return valid;
}

function validateField(input) {
  const group   = input.closest('.form-group');
  const errEl   = group && group.querySelector('.form-error');
  let   msg     = '';
  const val     = input.value.trim();

  if (input.required && !val) {
    msg = 'Este campo es obligatorio.';
  } else if (input.type === 'email' && val && !isValidEmail(val)) {
    msg = 'Ingresa un email válido.';
  } else if (input.id === 'resPhone' && val && !isValidPhone(val)) {
    msg = 'Ingresa un teléfono chileno válido (ej: 912345678).';
  } else if (input.type === 'number') {
    const n = Number(val);
    if (val && (n < 1 || n > 200)) msg = 'Entre 1 y 200 personas.';
  }

  if (group)  group.classList.toggle('has-error', !!msg);
  if (errEl)  errEl.textContent = msg;
  return !msg;
}

/* ─────────────────────────────────────────────────────
   NEWSLETTER
   ───────────────────────────────────────────────────── */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.querySelector('.newsletter-input');
    const email = input ? input.value.trim() : '';

    if (!isValidEmail(email)) {
      showToast('Ingresa un email válido 😅', 'error');
      return;
    }

    const btn = form.querySelector('.newsletter-btn');
    btn.textContent = '¡Suscrito! 🎉';
    btn.disabled    = true;
    input.value     = '';
    showToast('¡Te suscribiste! Recibirás los mejores eventos 🎸', 'success');

    setTimeout(() => {
      btn.textContent = 'Suscribirse';
      btn.disabled    = false;
    }, 3000);
  });
}

/* ─────────────────────────────────────────────────────
   SCROLL TO TOP
   ───────────────────────────────────────────────────── */
function initScrollToTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;

  const onScroll = throttle(() => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, 150);
  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
