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

import { submitReservation, submitNewsletter } from './api.js';

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollSpy();
  initHeroParallax();
  initLiveHours();
  initTransportTabs();
  initGalleryTabs();
  initLightbox();
  initReservationForm();
  initNewsletter();
  initScrollToTop();
  initEventsCarousel();
  bindEventsCarouselButtons();
  initTestimonialsCarousel();
  bindTestimonialsButtons();
  initScrollAnimations();
  initParallax();
  initHeroParticles();
  initRoseGarden();
  initCounters();
  initLazyLoad();
  initGalleryFilter();
});

/* ─────────────────────────────────────────────────────
   NAV
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
      personas: Number(form.querySelector('#resPeople').value),
      tipo:     form.querySelector('#resType').value,
      fecha:    form.querySelector('#resDate').value,
      mensaje:  (form.querySelector('#resMsg') || {}).value || '',
    };

    try {
      const result = await submitReservation(data);
      if (result.success) {
        form.style.display = 'none';
        if (success) success.style.display = 'block';
        showToast('¡Reserva enviada! Te contactaremos pronto 🎉', 'success');
      } else {
        const msg = result.errors
          ? result.errors.map(e => e.message).join(' ')
          : (result.message || 'Error al enviar la reserva.');
        showToast(msg, 'error');
        btn.textContent = '🎉 Confirmar Reserva';
        btn.disabled    = false;
      }
    } catch {
      showToast('Sin conexión con el servidor. Intenta más tarde.', 'error');
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

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = form.querySelector('.newsletter-input');
    const email = input ? input.value.trim() : '';

    if (!isValidEmail(email)) {
      showToast('Ingresa un email válido 😅', 'error');
      return;
    }

    const btn = form.querySelector('.newsletter-btn');
    btn.textContent = 'Enviando...';
    btn.disabled    = true;

    try {
      const result = await submitNewsletter(email);
      if (result.success) {
        input.value     = '';
        btn.textContent = '¡Suscrito! 🎉';
        showToast(result.message || '¡Te suscribiste! Recibirás los mejores eventos 🎸', 'success');
      } else {
        showToast(result.message || 'Error al suscribirse.', 'error');
        btn.textContent = '🔔 Suscribirse';
        btn.disabled    = false;
      }
    } catch {
      showToast('Sin conexión con el servidor. Intenta más tarde.', 'error');
      btn.textContent = '🔔 Suscribirse';
      btn.disabled    = false;
      return;
    }

    setTimeout(() => {
      btn.textContent = '🔔 Suscribirse';
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
