const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const TIPO_LABELS = {
  'mesa-estandar': 'Mesa Estándar',
  'mesa-vip': 'Mesa VIP',
  'vip-gold': '🏆 Paquete VIP Gold',
  'vip-platinum': '💎 Paquete VIP Platinum',
  'vip-diamond': '💠 Paquete VIP Diamond',
  'cumpleaños': '🎂 Cumpleaños',
};

async function sendReservationConfirmation(reservation) {
  const transporter = createTransporter();
  if (!transporter) return;

  const fechaStr = new Date(reservation.fecha).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tipoLabel = TIPO_LABELS[reservation.tipo] || reservation.tipo;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; background:#0d0d12; color:#e0e0e0; margin:0; padding:0; }
    .container { max-width:600px; margin:32px auto; background:#16161f; border-radius:12px; overflow:hidden; border:1px solid #2a2a3a; }
    .header { background:linear-gradient(135deg,#E8913A,#D4547B); padding:32px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:28px; letter-spacing:1px; }
    .header p  { color:rgba(255,255,255,0.9); margin:8px 0 0; font-size:14px; }
    .body { padding:32px; }
    .body h2 { color:#E8913A; margin-top:0; }
    .detail-row { display:flex; border-bottom:1px solid #2a2a3a; padding:10px 0; }
    .detail-label { color:#888; min-width:140px; font-size:14px; }
    .detail-value { color:#e0e0e0; font-size:14px; font-weight:600; }
    .badge { display:inline-block; background:rgba(232,145,58,0.15); border:1px solid rgba(232,145,58,0.4);
             color:#E8913A; padding:4px 12px; border-radius:20px; font-size:13px; }
    .footer { background:#0d0d12; padding:20px 32px; text-align:center; color:#555; font-size:12px; }
    .footer a { color:#E8913A; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌹 La Comadre Lola</h1>
      <p>Restaurant · Bar · Eventos — Quilicura, Santiago</p>
    </div>
    <div class="body">
      <h2>✅ ¡Reserva recibida, ${reservation.nombre}!</h2>
      <p>Hemos recibido tu solicitud de reserva. Nos contactaremos contigo pronto para confirmarla.</p>
      <div class="detail-row">
        <span class="detail-label">Tipo</span>
        <span class="detail-value">${tipoLabel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fecha</span>
        <span class="detail-value">${fechaStr}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Personas</span>
        <span class="detail-value">${reservation.personas}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Teléfono</span>
        <span class="detail-value">${reservation.telefono}</span>
      </div>
      ${reservation.mensaje ? `<div class="detail-row"><span class="detail-label">Mensaje</span><span class="detail-value">${reservation.mensaje}</span></div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Estado</span>
        <span class="detail-value"><span class="badge">Pendiente</span></span>
      </div>
      <br>
      <p>📍 <strong>Manuel Antonio Matta 1269, Quilicura, Santiago</strong></p>
      <p>🚇 Metro Línea 3 — Estación Lo Cruzat</p>
    </div>
    <div class="footer">
      <p>© 2025 La Comadre Lola · <a href="https://alexispferrada-wq.github.io/lacomadrelolaCL/">lacomadrelola.cl</a></p>
      <p>Si no realizaste esta reserva, ignora este correo.</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"La Comadre Lola 🌹" <${process.env.EMAIL_USER}>`,
    to: reservation.email,
    subject: `✅ Reserva recibida — La Comadre Lola (${fechaStr})`,
    html,
  });
}

async function sendReservationNotificationToAdmin(reservation) {
  const transporter = createTransporter();
  if (!transporter || !process.env.ADMIN_EMAIL) return;

  const fechaStr = new Date(reservation.fecha).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tipoLabel = TIPO_LABELS[reservation.tipo] || reservation.tipo;

  await transporter.sendMail({
    from: `"La Comadre Lola Sistema" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🔔 Nueva reserva — ${reservation.nombre} (${fechaStr})`,
    html: `
      <h2>Nueva reserva recibida</h2>
      <p><strong>Nombre:</strong> ${reservation.nombre}</p>
      <p><strong>Email:</strong> ${reservation.email}</p>
      <p><strong>Teléfono:</strong> ${reservation.telefono}</p>
      <p><strong>Tipo:</strong> ${tipoLabel}</p>
      <p><strong>Fecha:</strong> ${fechaStr}</p>
      <p><strong>Personas:</strong> ${reservation.personas}</p>
      ${reservation.mensaje ? `<p><strong>Mensaje:</strong> ${reservation.mensaje}</p>` : ''}
    `,
  });
}

async function sendNewsletterWelcome(email) {
  const transporter = createTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: `"La Comadre Lola 🌹" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎸 ¡Bienvenido/a a La Comadre Lola!',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family:Arial,sans-serif; background:#0d0d12; color:#e0e0e0; margin:0; padding:0; }
    .container { max-width:600px; margin:32px auto; background:#16161f; border-radius:12px; overflow:hidden; border:1px solid #2a2a3a; }
    .header { background:linear-gradient(135deg,#E8913A,#D4547B); padding:32px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:28px; }
    .header p  { color:rgba(255,255,255,0.9); margin:8px 0 0; }
    .body { padding:32px; }
    .footer { background:#0d0d12; padding:20px 32px; text-align:center; color:#555; font-size:12px; }
    .footer a { color:#E8913A; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌹 La Comadre Lola</h1>
      <p>Restaurant · Bar · Eventos — Quilicura</p>
    </div>
    <div class="body">
      <h2 style="color:#E8913A;">🎉 ¡Ya eres parte de la familia!</h2>
      <p>Gracias por suscribirte a nuestro newsletter. A partir de ahora recibirás:</p>
      <ul>
        <li>📅 La agenda semanal de eventos y shows en vivo</li>
        <li>🎟️ Pre-ventas exclusivas</li>
        <li>🎁 Ofertas y sorpresas especiales</li>
      </ul>
      <p>¡Nos vemos en La Comadre Lola! 🎸</p>
      <p>📍 Manuel Antonio Matta 1269, Quilicura, Santiago</p>
    </div>
    <div class="footer">
      <p>© 2025 La Comadre Lola · <a href="https://alexispferrada-wq.github.io/lacomadrelolaCL/">lacomadrelola.cl</a></p>
      <p>Para cancelar tu suscripción responde este correo con "DESUSCRIBIR".</p>
    </div>
  </div>
</body>
</html>`,
  });
}

module.exports = {
  sendReservationConfirmation,
  sendReservationNotificationToAdmin,
  sendNewsletterWelcome,
};
