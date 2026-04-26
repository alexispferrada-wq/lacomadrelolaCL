const Reservation = require('../models/Reservation');
const {
  sendReservationConfirmation,
  sendReservationNotificationToAdmin,
} = require('../config/mailer');

/* POST /api/reservations */
async function createReservation(req, res, next) {
  try {
    const { nombre, email, telefono, personas, tipo, fecha, mensaje } = req.body;

    const reservation = new Reservation({
      nombre,
      email,
      telefono,
      personas,
      tipo,
      fecha,
      mensaje,
    });

    await reservation.save();

    // Enviar emails en background (no bloquear respuesta)
    sendReservationConfirmation(reservation)
      .then(() => {
        reservation.emailConfirmadoEnviado = true;
        return reservation.save();
      })
      .catch(err => console.error('Error enviando email al cliente:', err.message));

    sendReservationNotificationToAdmin(reservation)
      .catch(err => console.error('Error enviando email al admin:', err.message));

    res.status(201).json({
      success: true,
      message: '¡Reserva recibida! Te contactaremos pronto para confirmarla.',
      data: {
        id: reservation._id,
        nombre: reservation.nombre,
        email: reservation.email,
        fecha: reservation.fecha,
        tipo: reservation.tipo,
        estado: reservation.estado,
      },
    });
  } catch (err) {
    next(err);
  }
}

/* GET /api/reservations  (requiere autenticación básica) */
async function getReservations(req, res, next) {
  try {
    const { estado, fecha, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (estado) filter.estado = estado;
    if (fecha) {
      const d = new Date(fecha);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.fecha = { $gte: d, $lt: next };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Reservation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: reservations,
    });
  } catch (err) {
    next(err);
  }
}

/* PATCH /api/reservations/:id/estado  (requiere autenticación básica) */
async function updateReservationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const allowed = ['pendiente', 'confirmada', 'cancelada'];
    if (!allowed.includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }

    res.json({ success: true, data: reservation });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReservation, getReservations, updateReservationStatus };
