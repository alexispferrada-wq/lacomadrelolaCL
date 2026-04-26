/* =====================================================
   API.JS — La Comadre Lola
   Configuración de la URL base del backend API
   ===================================================== */

// En producción apunta al backend desplegado; en desarrollo al localhost.
// Actualiza PROD_API_URL con la URL real de tu servidor (Render, Railway, etc.)
const PROD_API_URL = 'https://lacomadrelola-api.onrender.com';
const DEV_API_URL  = 'http://localhost:3001';

export const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? DEV_API_URL
    : PROD_API_URL;

/**
 * Envía una reserva al backend.
 * @param {Object} data
 * @returns {Promise<{success:boolean, message:string, data?:Object, errors?:Array}>}
 */
export async function submitReservation(data) {
  const res = await fetch(`${API_BASE}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

/**
 * Suscribe un email al newsletter.
 * @param {string} email
 * @returns {Promise<{success:boolean, message:string}>}
 */
export async function submitNewsletter(email) {
  const res = await fetch(`${API_BASE}/api/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}
