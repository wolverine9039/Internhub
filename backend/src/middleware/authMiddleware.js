const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const AppError = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';

/**
 * authenticate — Verifies the JWT from the Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
};

/**
 * authorize — Role-based guard. Pass allowed roles as arguments.
 * Usage: authorize('admin', 'trainer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', `Access denied. Required role: ${roles.join(' or ')}`));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
