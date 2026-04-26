const { Router } = require('express');
const { body } = require('express-validator');
const { subscribe, getSubscribers } = require('../controllers/newsletterController');
const { handleValidationErrors } = require('../middleware/validate');
const { basicAuth } = require('../middleware/auth');

const router = Router();

const newsletterValidations = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('Ingresa un email válido.')
    .normalizeEmail(),
];

/* Público */
router.post('/', newsletterValidations, handleValidationErrors, subscribe);

/* Protegido con autenticación básica */
router.get('/', basicAuth, getSubscribers);

module.exports = router;
