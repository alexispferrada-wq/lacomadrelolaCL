/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({ success: false, message: 'Datos inválidos.', errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.status(409).json({
      success: false,
      message: `El ${field} ya está registrado.`,
    });
  }

  // Mongoose cast error (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'ID no válido.' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Error interno del servidor.' : err.message,
  });
}

module.exports = errorHandler;
