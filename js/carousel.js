/* =====================================================
   CAROUSEL.JS — La Comadre Lola
   Events carousel & Testimonials carousel
   ===================================================== */

/* ── Events Carousel ─────────────────────────────── */

let eventsIndex  = 0;
let eventsTimer  = null;
const EVENTS_INTERVAL = 5000;

export function initEventsCarousel() {
  const track  = document.getElementById('eventsTrack');
  const dotsWrap = document.getElementById('eventsDots');
  if (!track) return;

  const slides = track.querySelectorAll('.events-slide');
  if (slides.length <= 1) return;

  // Build dots
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = i === 0 ? 't-dot active' : 't-dot';
      d.setAttribute('aria-label', `Evento ${i + 1}`);
      d.addEventListener('click', () => goToEventSlide(i));
      dotsWrap.appendChild(d);
    });
  }

  startEventsAutoplay();

  // Pause on hover
  track.addEventListener('mouseenter', stopEventsAutoplay);
  track.addEventListener('mouseleave', startEventsAutoplay);
  // Touch support
  addSwipeSupport(track, () => nextEventSlide(), () => prevEventSlide());
}

function goToEventSlide(idx) {
  const track  = document.getElementById('eventsTrack');
  const dotsWrap = document.getElementById('eventsDots');
  if (!track) return;

  const slides = track.querySelectorAll('.events-slide');
  eventsIndex  = (idx + slides.length) % slides.length;
  track.style.transform = `translateX(-${eventsIndex * 100}%)`;

  if (dotsWrap) {
    dotsWrap.querySelectorAll('.t-dot').forEach((d, i) => {
      d.classList.toggle('active', i === eventsIndex);
    });
  }
}

function nextEventSlide() {
  const track  = document.getElementById('eventsTrack');
  if (!track) return;
  goToEventSlide(eventsIndex + 1);
}
function prevEventSlide() {
  const track  = document.getElementById('eventsTrack');
  if (!track) return;
  goToEventSlide(eventsIndex - 1);
}

function startEventsAutoplay() {
  stopEventsAutoplay();
  eventsTimer = setInterval(nextEventSlide, EVENTS_INTERVAL);
}
function stopEventsAutoplay() {
  clearInterval(eventsTimer);
}

export function bindEventsCarouselButtons() {
  const prevBtn = document.getElementById('eventsPrev');
  const nextBtn = document.getElementById('eventsNext');
  if (prevBtn) prevBtn.addEventListener('click', () => { prevEventSlide(); stopEventsAutoplay(); startEventsAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextEventSlide(); stopEventsAutoplay(); startEventsAutoplay(); });
}

/* ── Testimonials Carousel ───────────────────────── */

let testimonialsIndex = 0;
let testimonialsTimer = null;
const TESTIMONIALS_INTERVAL = 6000;

export function initTestimonialsCarousel() {
  const track    = document.getElementById('testimonialsTrack');
  const dotsWrap = document.getElementById('testimonialsDots');
  if (!track) return;

  const slides = track.querySelectorAll('.testimonial-slide');
  if (slides.length <= 1) return;

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = i === 0 ? 't-dot active' : 't-dot';
      d.setAttribute('aria-label', `Testimonio ${i + 1}`);
      d.addEventListener('click', () => goToTestimonialSlide(i));
      dotsWrap.appendChild(d);
    });
  }

  startTestimonialsAutoplay();
  track.addEventListener('mouseenter', stopTestimonialsAutoplay);
  track.addEventListener('mouseleave', startTestimonialsAutoplay);
  addSwipeSupport(track, () => nextTestimonialSlide(), () => prevTestimonialSlide());
}

export function goToTestimonialSlide(idx) {
  const track    = document.getElementById('testimonialsTrack');
  const dotsWrap = document.getElementById('testimonialsDots');
  if (!track) return;

  const slides = track.querySelectorAll('.testimonial-slide');
  testimonialsIndex = (idx + slides.length) % slides.length;
  track.style.transform = `translateX(-${testimonialsIndex * 100}%)`;

  if (dotsWrap) {
    dotsWrap.querySelectorAll('.t-dot').forEach((d, i) => {
      d.classList.toggle('active', i === testimonialsIndex);
    });
  }
}

export function nextTestimonialSlide() { goToTestimonialSlide(testimonialsIndex + 1); }
export function prevTestimonialSlide() { goToTestimonialSlide(testimonialsIndex - 1); }

function startTestimonialsAutoplay() {
  stopTestimonialsAutoplay();
  testimonialsTimer = setInterval(nextTestimonialSlide, TESTIMONIALS_INTERVAL);
}
function stopTestimonialsAutoplay() { clearInterval(testimonialsTimer); }

export function bindTestimonialsButtons() {
  const prevBtn = document.getElementById('testimonialsPrev');
  const nextBtn = document.getElementById('testimonialsNext');
  if (prevBtn) prevBtn.addEventListener('click', () => { prevTestimonialSlide(); stopTestimonialsAutoplay(); startTestimonialsAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextTestimonialSlide(); stopTestimonialsAutoplay(); startTestimonialsAutoplay(); });
}

/* ── Swipe / Touch support helper ─────────────────── */
function addSwipeSupport(el, onSwipeLeft, onSwipeRight) {
  let startX = 0;
  el.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) onSwipeLeft();
      else          onSwipeRight();
    }
  }, { passive: true });
}
