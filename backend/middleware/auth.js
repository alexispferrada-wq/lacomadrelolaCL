function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const base64 = authHeader.replace(/^Basic\s+/i, '');
  let decoded = '';

  try {
    decoded = Buffer.from(base64, 'base64').toString('utf8');
  } catch {
    decoded = '';
  }

  const [user, ...rest] = decoded.split(':');
  const pass = rest.join(':');

  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASS || '';

  if (user === expectedUser && pass === expectedPass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Admin La Comadre Lola"');
  return res.status(401).json({ success: false, message: 'Autenticación requerida.' });
}

module.exports = { basicAuth };
