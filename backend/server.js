require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path     = require('path');
const jwt      = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_cambiar';

/* ── STATIC FILES ── */
const staticDir = process.env.STATIC_DIR || path.join(__dirname, '..');
console.log('📁 Estaticos desde:', staticDir);
app.use(express.static(staticDir));

/* ── CORS ── */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'null',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS no permitido: ' + origin));
  },
  credentials: true,
}));
app.use(express.json());

/* ── MONGODB ── */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

/* ── SCHEMAS ── */
const reservationSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  email:    { type: String, required: true },
  telefono: { type: String },
  fecha:    { type: String, required: true },
  hora:     { type: String, required: true },
  personas: { type: Number, required: true },
  mensaje:  { type: String },
  estado:   { type: String, default: 'pendiente', enum: ['pendiente','confirmada','cancelada'] },
  createdAt:{ type: Date, default: Date.now },
});

const newsletterSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Reservation = mongoose.model('Reservation', reservationSchema);
const Newsletter  = mongoose.model('Newsletter',  newsletterSchema);

/* ── MAILER ── */
let transporter = null;
if (process.env.EMAIL_USER && !process.env.EMAIL_USER.startsWith('PENDIENTE')) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  console.log('📧 Mailer:', process.env.EMAIL_USER);
} else {
  console.log('⚠️  Email no configurado');
}

async function sendMail(opts) {
  if (!transporter) return;
  try { await transporter.sendMail(opts); }
  catch (err) { console.error('Email error:', err.message); }
}

/* ── AUTH MIDDLEWARE ── */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'No autenticado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token invalido o expirado' });
  }
}

/* ══════════════════════════════════════════
   RUTAS PAGINAS LIMPIAS
══════════════════════════════════════════ */
app.get('/login',  (_req, res) => res.sendFile('login.html',      { root: staticDir }));
app.get('/admin',  (_req, res) => res.sendFile('admin.html',      { root: staticDir }));
app.get('/editor', (_req, res) => res.sendFile('editor_cms.html', { root: staticDir }));

/* ══════════════════════════════════════════
   API AUTH
══════════════════════════════════════════ */

/* POST /api/auth/login */
app.post('/api/auth/login', (req, res) => {
  const { usuario, password } = req.body;
  if (
    usuario  === (process.env.ADMIN_USER || 'admin') &&
    password === (process.env.ADMIN_PASS || 'lola2026')
  ) {
    const token = jwt.sign({ usuario, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ ok: true, token, usuario });
  }
  res.status(401).json({ ok: false, error: 'Usuario o contrasena incorrectos' });
});

/* GET /api/auth/me */
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

/* ══════════════════════════════════════════
   API ADMIN (protegidas)
══════════════════════════════════════════ */

/* GET /api/admin/stats */
app.get('/api/admin/stats', requireAuth, async (_req, res) => {
  try {
    const [totalReservas, pendientes, newsletter] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ estado: 'pendiente' }),
      Newsletter.countDocuments(),
    ]);
    res.json({ ok: true, totalReservas, pendientes, newsletter });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET /api/admin/reservations */
app.get('/api/admin/reservations', requireAuth, async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || '1');
    const limit = parseInt(req.query.limit || '20');
    const skip  = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Reservation.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Reservation.countDocuments(),
    ]);
    res.json({ ok: true, data: docs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* PATCH /api/admin/reservations/:id */
app.patch('/api/admin/reservations/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Reservation.findByIdAndUpdate(
      req.params.id, { estado: req.body.estado }, { new: true }
    );
    res.json({ ok: true, data: doc });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE /api/admin/reservations/:id */
app.delete('/api/admin/reservations/:id', requireAuth, async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET /api/admin/newsletter */
app.get('/api/admin/newsletter', requireAuth, async (_req, res) => {
  try {
    const docs = await Newsletter.find().sort({ createdAt: -1 });
    res.json({ ok: true, data: docs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE /api/admin/newsletter/:id */
app.delete('/api/admin/newsletter/:id', requireAuth, async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ══════════════════════════════════════════
   API PUBLICA
══════════════════════════════════════════ */

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

/* POST /api/reservations */
app.post('/api/reservations', async (req, res) => {
  try {
    const { nombre, email, telefono, fecha, hora, personas, mensaje } = req.body;
    if (!nombre || !email || !fecha || !hora || !personas)
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });

    const doc = await Reservation.create({ nombre, email, telefono, fecha, hora, personas, mensaje });

    await sendMail({
      from: process.env.EMAIL_USER,
      to:   process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🌹 Nueva reserva — ${nombre}`,
      html: `<h2>Nueva reserva</h2>
        <p><b>Nombre:</b> ${nombre}<br><b>Email:</b> ${email}<br>
        <b>Telefono:</b> ${telefono || '-'}<br><b>Fecha:</b> ${fecha} ${hora}<br>
        <b>Personas:</b> ${personas}<br><b>Mensaje:</b> ${mensaje || '-'}</p>`,
    });

    await sendMail({
      from:    process.env.EMAIL_USER,
      to:      email,
      subject: '🌹 Reserva confirmada — La Comadre Lola',
      html: `<h2>Tu reserva esta lista, ${nombre}!</h2>
        <p>Nos vemos el <b>${fecha} a las ${hora}</b> con <b>${personas} persona(s)</b>.</p>
        <p>📍 Manuel Antonio Matta 1269, Quilicura</p>`,
    });

    res.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

/* POST /api/newsletter */
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: 'Email requerido' });
    await Newsletter.create({ email });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ ok: true, msg: 'Ya estas suscrito/a' });
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

/* ── START ── */
app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
  console.log(`   /login  /admin  /editor`);
});
