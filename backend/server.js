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
const JWT_SECRET     = process.env.JWT_SECRET     || 'fallback_dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const rawOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS = rawOrigins.length
  ? rawOrigins
  : ['https://alexispferrada-wq.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'];

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
app.use(express.json({ limit: '2mb' }));

/* ── JSON helpers ── */
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
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
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/* ── Validation helpers ── */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const validUser = username === ADMIN_USERNAME;
  // Use constant-time comparison via bcrypt if stored as hash, otherwise plain compare
  const validPass = password === ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
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
  if (isNaN(numPersonas) || numPersonas < 1 || numPersonas > 200) {
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
