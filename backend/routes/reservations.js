const { Router } = require('express');
const { body } = require('express-validator');
const { createReservation, getReservations, updateReservationStatus } = require('../controllers/reservationController');
const { handleValidationErrors } = require('../middleware/validate');
const { basicAuth } = require('../middleware/auth');

const router = Router();

const reservationValidations = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 120 }).withMessage('El nombre no puede superar 120 caracteres.'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('Ingresa un email válido.')
    .normalizeEmail(),
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio.')
    .matches(/^(\+?56)?[2-9]\d{7,8}$/).withMessage('Ingresa un teléfono chileno válido (ej: 912345678).'),
  body('personas')
    .notEmpty().withMessage('La cantidad de personas es obligatoria.')
    .isInt({ min: 1, max: 200 }).withMessage('Debe ser entre 1 y 200 personas.'),
  body('tipo')
    .notEmpty().withMessage('El tipo de reserva es obligatorio.')
    .isIn(['mesa-estandar', 'mesa-vip', 'vip-gold', 'vip-platinum', 'vip-diamond', 'cumpleaños'])
    .withMessage('Tipo de reserva no válido.'),
  body('fecha')
    .notEmpty().withMessage('La fecha es obligatoria.')
    .isISO8601().withMessage('Formato de fecha no válido.')
    .custom(value => {
      const d = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) throw new Error('La fecha no puede ser en el pasado.');
      return true;
    }),
  body('mensaje')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El mensaje no puede superar 500 caracteres.'),
];

/* Público */
router.post('/', reservationValidations, handleValidationErrors, createReservation);

/* Protegido con autenticación básica */
router.get('/', basicAuth, getReservations);
router.patch('/:id/estado', basicAuth, updateReservationStatus);

module.exports = router;
