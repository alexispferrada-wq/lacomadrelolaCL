const Newsletter = require('../models/Newsletter');
const { sendNewsletterWelcome } = require('../config/mailer');

/* POST /api/newsletter */
async function subscribe(req, res, next) {
  try {
    const { email } = req.body;

    // Verificar si ya está suscrito
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.activo) {
        return res.status(409).json({
          success: false,
          message: 'Este email ya está suscrito al newsletter.',
        });
      }
      // Reactivar si estaba desuscrito
      existing.activo = true;
      await existing.save();
      sendNewsletterWelcome(email).catch(err =>
        console.error('Error enviando email bienvenida:', err.message)
      );
      return res.json({
        success: true,
        message: '¡Te has vuelto a suscribir! Bienvenido/a de vuelta.',
      });
    }

    const subscription = new Newsletter({ email });
    await subscription.save();

    // Enviar email de bienvenida en background
    sendNewsletterWelcome(email)
      .then(() => {
        subscription.emailBienvenidaEnviado = true;
        return subscription.save();
      })
      .catch(err => console.error('Error enviando email bienvenida:', err.message));

    res.status(201).json({
      success: true,
      message: '¡Te suscribiste! Recibirás los mejores eventos 🎸',
    });
  } catch (err) {
    next(err);
  }
}

/* GET /api/newsletter  (requiere autenticación básica) */
async function getSubscribers(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total] = await Promise.all([
      Newsletter.find({ activo: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Newsletter.countDocuments({ activo: true }),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: subscribers,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { subscribe, getSubscribers };
