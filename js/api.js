/* =====================================================
   API.JS — La Comadre Lola
   Frontend API client.
   Connects to the backend when available.
   Falls back to static content when offline or API
   is not configured.
   ===================================================== */

/**
 * Base URL of the backend.
 * Change this to your deployed backend URL.
 * e.g. 'https://lacomadrelola-api.railway.app'
 */
export const API_BASE_URL = 'http://localhost:3001';

/** Maximum time (ms) to wait for the API before using fallback data */
const API_TIMEOUT_MS = 4000;

/**
 * Fetch with a timeout. Rejects if the request takes too long.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Fetch active events from the backend.
 * Returns null if the API is not reachable, so callers can fallback
 * to the static HTML.
 *
 * @returns {Promise<Array|null>}
 */
export async function fetchEvents() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/events`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Submit a reservation to the backend.
 *
 * @param {object} data — form fields
 * @returns {Promise<{ok: boolean, message: string, id?: string}>}
 */
export async function submitReservation(data) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/reservations`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: body.error || `Error ${res.status}` };
    }
    return { ok: true, message: body.message || '¡Reserva enviada!', id: body.id };
  } catch {
    return { ok: false, message: null }; // null means: API unreachable, use fallback
  }
}

/**
 * Fetch carousel slides from the backend.
 * Returns null if the API is not reachable.
 *
 * @returns {Promise<Array|null>}
 */
export async function fetchCarouselSlides() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/carousel`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
