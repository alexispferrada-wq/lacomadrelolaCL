/* =====================================================
   SERVER.JS — La Comadre Lola Backend
   Express REST API para gestión de eventos,
   reservas y carrusel principal.
   ===================================================== */

'use strict';

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const rateLimit  = require('express-rate-limit');
const { randomUUID } = require('crypto');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Paths ── */
const DATA_DIR         = path.join(__dirname, 'data');
const EVENTS_FILE      = path.join(DATA_DIR, 'events.json');
const RESERVATIONS_FILE= path.join(DATA_DIR, 'reservations.json');
const CAROUSEL_FILE    = path.join(DATA_DIR, 'carousel.json');

/* ── Config ── */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LaComadre2026!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Require a proper JWT secret; generate a warning in development
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET not set. Using an insecure default — do NOT deploy this to production!');
  }
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev_only_insecure_secret_do_not_deploy';

// Hash admin password once at startup for constant-time comparison
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

const rawOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS = rawOrigins.length
  ? rawOrigins
  : ['https://alexispferrada-wq.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'];

/* ── Max reservation size constant ── */
const MAX_RESERVATION_SIZE = 200;

/* ── Rate limiters ── */
// Strict limiter for the login endpoint to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

// General limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' },
});

/* ── Middleware ── */
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) in dev
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.options('*', cors());
app.use(generalLimiter);
app.use(express.json({ limit: '2mb' }));

/* ── JSON helpers ── */
function readJSON(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`[readJSON] Error reading ${path.basename(file)}:`, err.message);
    }
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/* ── Auth middleware ── */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    req.admin = jwt.verify(token, EFFECTIVE_JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/* ── Validation helpers ── */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Use a safe, linear-time check instead of a potentially slow regex
  const at = trimmed.indexOf('@');
  if (at < 1 || at !== trimmed.lastIndexOf('@')) return false;
  const domain = trimmed.slice(at + 1);
  const dot    = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1 && !trimmed.includes(' ');
}

function isValidPhone(phone) {
  const cleaned = String(phone || '').replace(/\s+/g, '').replace('+56', '');
  return /^9\d{8}$/.test(cleaned);
}

/* ══════════════════════════════════════════════════════
   ROUTES
══════════════════════════════════════════════════════ */

/* ── Health check ── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'La Comadre Lola API', version: '1.0.0' });
});

/* ══════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════ */

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  // Use constant-time bcrypt comparison to prevent timing attacks
  const validUser = username === ADMIN_USERNAME;
  const validPass = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);

  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({ token, expiresIn: JWT_EXPIRES_IN });
});

/* ══════════════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════════════ */

/* GET /api/events — public */
app.get('/api/events', (_req, res) => {
  const events = readJSON(EVENTS_FILE)
    .filter(e => e.active !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  res.json(events);
});

/* GET /api/events/all — admin (includes inactive) */
app.get('/api/events/all', requireAuth, (_req, res) => {
  const events = readJSON(EVENTS_FILE)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  res.json(events);
});

/* POST /api/events — admin */
app.post('/api/events', requireAuth, (req, res) => {
  const { name, genre, date, badge, image, location, btnText, active, order } = req.body || {};

  if (!name || !date) {
    return res.status(400).json({ error: 'name y date son obligatorios' });
  }

  const events  = readJSON(EVENTS_FILE);
  const newEvent = {
    id:       `evt-${randomUUID().split('-')[0]}`,
    name:     String(name).trim(),
    genre:    String(genre || '').trim(),
    date:     String(date).trim(),
    badge:    String(badge || '').trim(),
    image:    String(image || '').trim(),
    location: String(location || 'Quilicura').trim(),
    btnText:  String(btnText || '🎟 Comprar Entradas').trim(),
    active:   active !== false,
    order:    Number(order) || events.length + 1,
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  writeJSON(EVENTS_FILE, events);
  res.status(201).json(newEvent);
});

/* PUT /api/events/:id — admin */
app.put('/api/events/:id', requireAuth, (req, res) => {
  const events = readJSON(EVENTS_FILE);
  const idx    = events.findIndex(e => e.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Evento no encontrado' });

  const allowed = ['name','genre','date','badge','image','location','btnText','active','order'];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) events[idx][k] = req.body[k];
  });
  events[idx].updatedAt = new Date().toISOString();

  writeJSON(EVENTS_FILE, events);
  res.json(events[idx]);
});

/* DELETE /api/events/:id — admin */
app.delete('/api/events/:id', requireAuth, (req, res) => {
  let events = readJSON(EVENTS_FILE);
  const found = events.some(e => e.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Evento no encontrado' });

  events = events.filter(e => e.id !== req.params.id);
  writeJSON(EVENTS_FILE, events);
  res.json({ message: 'Evento eliminado' });
});

/* ══════════════════════════════════════════════════════
   RESERVATIONS
══════════════════════════════════════════════════════ */

/* POST /api/reservations — public (from frontend form) */
app.post('/api/reservations', (req, res) => {
  const { nombre, email, telefono, personas, tipo, fecha, mensaje } = req.body || {};

  if (!nombre || !email || !telefono || !personas || !tipo || !fecha) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (!isValidPhone(telefono)) {
    return res.status(400).json({ error: 'Teléfono inválido (ej: 912345678)' });
  }
  const numPersonas = Number(personas);
  if (isNaN(numPersonas) || numPersonas < 1 || numPersonas > MAX_RESERVATION_SIZE) {
    return res.status(400).json({ error: 'Personas debe estar entre 1 y 200' });
  }

  const reservations = readJSON(RESERVATIONS_FILE);
  const newRes = {
    id:        `res-${randomUUID().split('-')[0]}`,
    nombre:    String(nombre).trim(),
    email:     String(email).trim().toLowerCase(),
    telefono:  String(telefono).trim(),
    personas:  numPersonas,
    tipo:      String(tipo).trim(),
    fecha:     String(fecha).trim(),
    mensaje:   String(mensaje || '').trim(),
    status:    'pendiente',
    createdAt: new Date().toISOString(),
  };

  reservations.push(newRes);
  writeJSON(RESERVATIONS_FILE, reservations);
  res.status(201).json({ message: '¡Reserva recibida! Te contactaremos pronto 🎉', id: newRes.id });
});

/* GET /api/reservations — admin */
app.get('/api/reservations', requireAuth, (_req, res) => {
  const reservations = readJSON(RESERVATIONS_FILE)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(reservations);
});

/* PUT /api/reservations/:id — admin (update status) */
app.put('/api/reservations/:id', requireAuth, (req, res) => {
  const reservations = readJSON(RESERVATIONS_FILE);
  const idx = reservations.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Reserva no encontrada' });

  const allowed = ['status', 'mensaje'];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) reservations[idx][k] = req.body[k];
  });
  reservations[idx].updatedAt = new Date().toISOString();
  writeJSON(RESERVATIONS_FILE, reservations);
  res.json(reservations[idx]);
});

/* DELETE /api/reservations/:id — admin */
app.delete('/api/reservations/:id', requireAuth, (req, res) => {
  let reservations = readJSON(RESERVATIONS_FILE);
  const found = reservations.some(r => r.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Reserva no encontrada' });

  reservations = reservations.filter(r => r.id !== req.params.id);
  writeJSON(RESERVATIONS_FILE, reservations);
  res.json({ message: 'Reserva eliminada' });
});

/* ══════════════════════════════════════════════════════
   CAROUSEL
══════════════════════════════════════════════════════ */

/* GET /api/carousel — public */
app.get('/api/carousel', (_req, res) => {
  const slides = readJSON(CAROUSEL_FILE)
    .filter(s => s.active !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  res.json(slides);
});

/* GET /api/carousel/all — admin */
app.get('/api/carousel/all', requireAuth, (_req, res) => {
  const slides = readJSON(CAROUSEL_FILE)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  res.json(slides);
});

/* POST /api/carousel — admin */
app.post('/api/carousel', requireAuth, (req, res) => {
  const { title, subtitle, badge, image, ctaPrimary, ctaSecondary, active, order } = req.body || {};

  if (!title || !image) {
    return res.status(400).json({ error: 'title e image son obligatorios' });
  }

  const slides   = readJSON(CAROUSEL_FILE);
  const newSlide = {
    id:           `slide-${randomUUID().split('-')[0]}`,
    title:        String(title).trim(),
    subtitle:     String(subtitle || '').trim(),
    badge:        String(badge || '').trim(),
    image:        String(image).trim(),
    ctaPrimary:   ctaPrimary   || { text: '🎉 RESERVA AHORA', href: '#reservas' },
    ctaSecondary: ctaSecondary || { text: '🎤 Ver Eventos',   href: '#eventos'  },
    active:       active !== false,
    order:        Number(order) || slides.length + 1,
    createdAt:    new Date().toISOString(),
  };

  slides.push(newSlide);
  writeJSON(CAROUSEL_FILE, slides);
  res.status(201).json(newSlide);
});

/* PUT /api/carousel/:id — admin */
app.put('/api/carousel/:id', requireAuth, (req, res) => {
  const slides = readJSON(CAROUSEL_FILE);
  const idx    = slides.findIndex(s => s.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Slide no encontrado' });

  const allowed = ['title','subtitle','badge','image','ctaPrimary','ctaSecondary','active','order'];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) slides[idx][k] = req.body[k];
  });
  slides[idx].updatedAt = new Date().toISOString();

  writeJSON(CAROUSEL_FILE, slides);
  res.json(slides[idx]);
});

/* DELETE /api/carousel/:id — admin */
app.delete('/api/carousel/:id', requireAuth, (req, res) => {
  let slides = readJSON(CAROUSEL_FILE);
  const found = slides.some(s => s.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Slide no encontrado' });

  slides = slides.filter(s => s.id !== req.params.id);
  writeJSON(CAROUSEL_FILE, slides);
  res.json({ message: 'Slide eliminado' });
});

/* ── 404 fallback ── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

/* ── Error handler ── */
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`✅ La Comadre Lola API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});
