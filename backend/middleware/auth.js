const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route — must be logged in
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.isActive === false || req.user.isFraudulent === true) {
      return res.status(403).json({ message: 'Account is inactive' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token failed', error: err.message });
  }
};

// Role-based guard factory
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role '${req.user.role}' is not allowed to access this route` });
  }
  next();
};

module.exports = { protect, authorizeRoles };
