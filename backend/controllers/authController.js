const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/activityLogger');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required' });

  const validRoles = ['student', 'company', 'university_admin', 'system_admin'];
  if (!validRoles.includes(role))
    return res.status(400).json({ message: 'Invalid role' });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name,
      email,
      password,
      role,
      approvalStatus: role === 'company' ? 'pending' : 'approved',
      isActive: role !== 'company',
    });

    await logActivity({
      actor: user,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role, approvalStatus: user.approvalStatus },
    });

    const responseMessage =
      role === 'company'
        ? 'Registration submitted. Your company account requires admin approval before login.'
        : 'Registration successful';

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: role === 'company' ? null : generateToken(user._id),
      approvalStatus: user.approvalStatus,
      message: responseMessage,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (user.isActive === false || user.isFraudulent === true) {
      return res.status(403).json({ message: 'Account is inactive. Please contact admin.' });
    }

    if (user.role === 'company' && user.approvalStatus && user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: `Company account is ${user.approvalStatus}. Admin approval is required.` });
    }

    await logActivity({
      actor: user,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role },
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };
