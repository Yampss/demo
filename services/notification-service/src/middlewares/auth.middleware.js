const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'banking_jwt_secret_key';

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const internalOnly = (req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (key !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ success: false, message: 'Internal access only' });
  }
  next();
};

module.exports = { authenticate, internalOnly };
