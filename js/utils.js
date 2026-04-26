/* =====================================================
   UTILS.JS — La Comadre Lola
   Helper functions used across the app
   ===================================================== */

/**
 * Debounce: limits how often a function can fire.
 * @param {Function} fn
 * @param {number} delay ms
 * @returns {Function}
 */
export function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle: ensures a function runs at most once per interval.
 * @param {Function} fn
 * @param {number} limit ms
 * @returns {Function}
 */
export function throttle(fn, limit = 100) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn.apply(this, args); }
  };
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a Date to Chilean locale short string.
 * e.g. "Viernes 18 Jul • 22:00"
 */
export function formatDateCL(date) {
  const days  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months= ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} • ${hh}:${mm}`;
}

/**
 * Zero-pad a number to `digits` digits.
 */
export function pad(n, digits = 2) {
  return String(n).padStart(digits, '0');
}

/**
 * Validate email address format.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate Chilean phone (9 digits starting with 9, or with +56 prefix).
 */
export function isValidPhone(phone) {
  const cleaned = phone.replace(/\s+/g, '').replace('+56','');
  return /^9\d{8}$/.test(cleaned);
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
export function showToast(message, type = 'success') {
  const existing = document.querySelector('.lola-toast');
  if (existing) existing.remove();

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const colors = {
    success: 'rgba(78,205,196,0.15)',
    error:   'rgba(255,82,82,0.15)',
    info:    'rgba(232,145,58,0.15)',
  };
  const borders = {
    success: 'rgba(78,205,196,0.4)',
    error:   'rgba(255,82,82,0.4)',
    info:    'rgba(232,145,58,0.4)',
  };

  const toast = document.createElement('div');
  toast.className = 'lola-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: colors[type],
    border: `1px solid ${borders[type]}`,
    backdropFilter: 'blur(16px)',
    color: '#fff', fontFamily: 'Inter, sans-serif',
    fontSize: '14px', fontWeight: '500',
    padding: '12px 24px', borderRadius: '30px',
    display: 'flex', alignItems: 'center', gap: '8px',
    zIndex: '9999', opacity: '0',
    transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
    whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
  });
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/**
 * Get current day hours status.
 * Returns { isOpen, phrase, nextEvent, schedule }
 */
export function getBusinessStatus() {
  const schedule = [
    { days: [0],    label: 'Domingo',          open: '13:00', close: '19:00', emoji: '☀️'  },
    { days: [1,2],  label: 'Lunes - Martes',   open: null,    close: null,    emoji: '😴'  },
    { days: [3],    label: 'Miércoles',         open: '17:00', close: '00:00', emoji: '🐫'  },
    { days: [4],    label: 'Jueves',            open: '17:00', close: '01:00', emoji: '🍻'  },
    { days: [5,6],  label: 'Viernes - Sábado',  open: '13:00', close: '02:00', emoji: '🔥'  },
  ];

  const now    = new Date();
  const dayNum = now.getDay(); // 0=Sun
  const hours  = now.getHours();
  const mins   = now.getMinutes();
  const nowMins = hours * 60 + mins;

  let todaySchedule = null;
  for (const s of schedule) {
    if (s.days.includes(dayNum)) { todaySchedule = s; break; }
  }

  const openPhrases  = ['¡Estamos carreteando! 🎉','¡Ven a la Comadre! 🔥','¡Estamos abiertos! 🌮','¡Te esperamos! 🍻'];
  const closedPhrases= ['Descansando pa\' el próximo carrete 😴','Recargando energías 💪','Nos vemos pronto 🌹','Mañana más y mejor 🎸'];
  const randomOf = arr => arr[Math.floor(Math.random() * arr.length)];

  if (!todaySchedule || !todaySchedule.open) {
    return { isOpen: false, phrase: randomOf(closedPhrases), todaySchedule, schedule };
  }

  const [oh, om] = todaySchedule.open.split(':').map(Number);
  const openMins = oh * 60 + om;

  let closeMins;
  const [ch, cm] = todaySchedule.close.split(':').map(Number);
  closeMins = ch * 60 + cm;
  // Handle past midnight closings (01:00, 02:00 = 25:00, 26:00)
  if (ch < 12) closeMins += 24 * 60;

  const isOpen = nowMins >= openMins && nowMins < closeMins;
  return {
    isOpen,
    phrase: isOpen ? randomOf(openPhrases) : randomOf(closedPhrases),
    openMins,
    closeMins: todaySchedule.close,
    nowMins,
    todaySchedule,
    schedule,
  };
}

/**
 * Lazy-load images: swap data-src → src when in viewport.
 */
export function initLazyLoad() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        obs.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  document.querySelectorAll('img[data-src]').forEach(img => io.observe(img));
}
