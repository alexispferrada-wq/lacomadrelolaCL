/* =====================================================
   SERVER.JS — La Comadre Lola Backend API
   Node.js + Express + MongoDB
   ===================================================== */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const reservationsRouter = require('./routes/reservations');
const newsletterRouter   = require('./routes/newsletter');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── CORS ── */
const allowedOrigins = [
  'https://alexispferrada-wq.github.io',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Permitir requests sin origin (ej. curl, Postman, mismo servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido — ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/* ── Body Parsers ── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ── Health check ── */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── Routes ── */
app.use('/api/reservations', reservationsRouter);
app.use('/api/newsletter',   newsletterRouter);

/* ── 404 ── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

/* ── Error Handler ── */
app.use(errorHandler);

/* ── Inicio ── */
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`   POST /api/reservations   — Nueva reserva`);
    console.log(`   GET  /api/reservations   — Listar reservas (admin)`);
    console.log(`   POST /api/newsletter     — Suscribirse`);
    console.log(`   GET  /api/newsletter     — Listar suscriptores (admin)`);
    console.log(`   GET  /health             — Health check`);
  });
}

start();
