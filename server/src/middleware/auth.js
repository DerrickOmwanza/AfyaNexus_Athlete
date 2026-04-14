const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Accept token from httpOnly cookie first, fall back to Authorization header
  const cookieToken = req.cookies?.afyanexus_token;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Role guard — pass allowed roles e.g. authorizeRoles('coach', 'athlete')
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorizeRoles };
