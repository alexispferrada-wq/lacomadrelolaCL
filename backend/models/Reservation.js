const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      maxlength: [120, 'El nombre no puede superar 120 caracteres.'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ingresa un email válido.'],
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio.'],
      trim: true,
      match: [/^(\+?56)?[2-9]\d{7,8}$/, 'Ingresa un teléfono chileno válido.'],
    },
    personas: {
      type: Number,
      required: [true, 'La cantidad de personas es obligatoria.'],
      min: [1, 'Debe haber al menos 1 persona.'],
      max: [200, 'Máximo 200 personas.'],
    },
    tipo: {
      type: String,
      required: [true, 'El tipo de reserva es obligatorio.'],
      enum: {
        values: [
          'mesa-estandar',
          'mesa-vip',
          'vip-gold',
          'vip-platinum',
          'vip-diamond',
          'cumpleaños',
        ],
        message: 'Tipo de reserva no válido.',
      },
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria.'],
    },
    mensaje: {
      type: String,
      trim: true,
      maxlength: [500, 'El mensaje no puede superar 500 caracteres.'],
      default: '',
    },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmada', 'cancelada'],
      default: 'pendiente',
    },
    emailConfirmadoEnviado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index para búsquedas frecuentes
reservationSchema.index({ email: 1 });
reservationSchema.index({ fecha: 1 });
reservationSchema.index({ estado: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
