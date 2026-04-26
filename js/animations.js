/* =====================================================
   ANIMATIONS.JS — La Comadre Lola
   Scroll-triggered animations via Intersection Observer
   ===================================================== */

/**
 * Initialise all scroll-reveal animations.
 * Targets any element with class: reveal | reveal-left | reveal-right | reveal-scale
 */
export function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: make all elements visible immediately
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(el => el.classList.add('visible'));
    return;
  }

  const options = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // fire only once
      }
    });
  }, options);

  const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
  document.querySelectorAll(selectors).forEach(el => observer.observe(el));
}

/**
 * Animate timeline line when it enters the viewport.
 */
export function initTimelineAnimation() {
  const track = document.querySelector('.timeline-track');
  if (!track) return;

  const line = track.querySelector('::before'); // CSS handles it
  // Use a section observer instead
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        track.classList.add('animated');
        observer.unobserve(track);
      }
    });
  }, { threshold: 0.1 });
  observer.observe(track);
}

/**
 * Parallax on the hero background.
 * Subtle downward shift on scroll.
 */
export function initParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const limit    = window.innerHeight;
        if (scrolled < limit) {
          heroBg.style.transform = `translateY(${scrolled * 0.3}px) scale(1.05)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Number counter animation for stats.
 * @param {Element} el  - element with data-target attribute
 * @param {number} duration ms
 */
function animateCounter(el, duration = 1800) {
  const target = parseInt(el.dataset.target, 10);
  const start  = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('es-CL');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Observe stat counters and start when visible.
 */
export function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/**
 * Hero particle system.
 * Creates small floating dots in the hero background.
 */
export function initHeroParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;

  const COUNT = 18;
  const colors = ['rgba(232,145,58,', 'rgba(212,84,123,', 'rgba(78,205,196,'];

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    const color = colors[i % colors.length];
    const size  = Math.random() * 4 + 1;
    const x     = Math.random() * 100;
    const delay = Math.random() * 8;
    const dur   = Math.random() * 10 + 8;
    const opacity = (Math.random() * 0.4 + 0.1).toFixed(2);

    Object.assign(p.style, {
      position: 'absolute',
      width:  `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: `${color}${opacity})`,
      left: `${x}%`,
      top:  `${Math.random() * 100}%`,
      animation: `floatParticle ${dur}s ease-in-out ${delay}s infinite`,
    });
    container.appendChild(p);
  }
}

/**
 * Rose / Petal falling decoration.
 */
export function initRoseGarden() {
  const container = document.getElementById('rose-garden-container');
  if (!container) return;

  const ROSES  = 24;
  const PETALS = 8;

  function createFalling(isRose, isLeft, index) {
    const el   = document.createElement('div');
    const edge = (Math.random() * 2.5).toFixed(1);
    el.className = isRose ? 'rose' : 'petal';

    if (isRose) {
      el.innerHTML = '🌹';
      const size = Math.random() * 16 + 12;
      el.style.fontSize  = `${size}px`;
    } else {
      const size = Math.random() * 8 + 4;
      el.style.width  = `${size}px`;
      el.style.height = `${size}px`;
    }

    el.style[isLeft ? 'left' : 'right'] = `${edge}%`;
    el.style.animationDuration  = `${Math.random() * 8 + 6}s`;
    el.style.animationDelay     = `${Math.random() * 10}s`;
    el.style.animationTimingFunction = 'linear';
    container.appendChild(el);
  }

  for (let i = 0; i < ROSES / 2;  i++) { createFalling(true,  true,  i); }
  for (let i = 0; i < ROSES / 2;  i++) { createFalling(true,  false, i); }
  for (let i = 0; i < PETALS / 2; i++) { createFalling(false, true,  i); }
  for (let i = 0; i < PETALS / 2; i++) { createFalling(false, false, i); }
}
