/* =====================================================
   CURSOR.JS — La Comadre Lola
   Custom magnetic neon cursor.
   - Small dot tracks the mouse exactly
   - Outer ring follows with elastic lag
   - Grows and changes color over interactive elements
   ===================================================== */

export function initMagneticCursor() {
  // Only on non-touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (typeof window === 'undefined') return;
  // Respect reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX  = -100, ringY  = -100;
  let rafId  = null;
  let isOverMagnetic = false;
  let magnetX = 0, magnetY = 0;

  // Show cursor elements
  dot.style.opacity  = '1';
  ring.style.opacity = '1';
  document.body.classList.add('custom-cursor');

  /* ── Track mouse ── */
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  /* ── Magnetic effect on interactive elements ── */
  const magneticSelectors = 'a, button, .event-btn, .vip-btn, .btn-primary, .btn-secondary, .gallery-item, .nav-btn';

  function setupMagneticElements() {
    document.querySelectorAll(magneticSelectors).forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add('is-hovering');
        dot.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('is-hovering');
        dot.classList.remove('is-hovering');
        isOverMagnetic = false;
        magnetX = 0;
        magnetY = 0;
      });
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = e.clientX - cx;
        const dy   = e.clientY - cy;
        isOverMagnetic = true;
        magnetX = dx * 0.25;
        magnetY = dy * 0.25;
      }, { passive: true });
    });
  }

  setupMagneticElements();

  // Re-apply after dynamic content load (events rendered from API)
  document.addEventListener('lola:eventsRendered', setupMagneticElements);

  /* ── Click pulse ── */
  document.addEventListener('mousedown', () => {
    ring.classList.add('is-clicking');
    dot.classList.add('is-clicking');
  });
  document.addEventListener('mouseup', () => {
    ring.classList.remove('is-clicking');
    dot.classList.remove('is-clicking');
  });

  /* ── Animation loop: elastic ring ── */
  const LERP_RING = 0.11; // lower = more lag

  function animate() {
    // Dot: instant
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

    // Ring: lerp towards cursor + magnetic offset
    const targetX = isOverMagnetic ? mouseX + magnetX : mouseX;
    const targetY = isOverMagnetic ? mouseY + magnetY : mouseY;

    ringX += (targetX - ringX) * LERP_RING;
    ringY += (targetY - ringY) * LERP_RING;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

    rafId = requestAnimationFrame(animate);
  }

  animate();

  /* ── Hide when cursor leaves window ── */
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
  });
}
