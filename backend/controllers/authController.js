const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
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

// GET /api/auth/google/config — lets the frontend render the Google button
const getGoogleConfig = (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
};

// POST /api/auth/google — sign in or sign up with a Google ID token
const googleAuth = async (req, res) => {
  const { credential, role } = req.body;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ message: 'Google sign-in is not configured' });
  if (!credential) return res.status(400).json({ message: 'Google credential is required' });

  let payload;
  try {
    const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Google sign-in', error: err.message });
  }
  if (!payload?.email || !payload.email_verified)
    return res.status(401).json({ message: 'Google account email is not verified' });

  try {
    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    let created = false;

    if (!user) {
      // Admin roles cannot be self-assigned through Google sign-up
      const newRole = role === 'company' ? 'company' : 'student';
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'),
        role: newRole,
        authProvider: 'google',
        googleId: payload.sub,
        avatar: payload.picture,
        approvalStatus: newRole === 'company' ? 'pending' : 'approved',
        isActive: newRole !== 'company',
      });
      created = true;
      await logActivity({
        actor: user,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user._id,
        details: { role: user.role, approvalStatus: user.approvalStatus, provider: 'google' },
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.avatar) user.avatar = payload.picture;
      await user.save();
    }

    if (user.role === 'company' && user.approvalStatus !== 'approved') {
      return res.status(created ? 201 : 403).json({
        message: created
          ? 'Registration submitted. Your company account requires admin approval before login.'
          : `Company account is ${user.approvalStatus}. Admin approval is required.`,
        approvalStatus: user.approvalStatus,
        token: null,
      });
    }
    if (user.isActive === false || user.isFraudulent === true)
      return res.status(403).json({ message: 'Account is inactive. Please contact admin.' });

    if (!created) {
      await logActivity({
        actor: user,
        action: 'USER_LOGGED_IN',
        entityType: 'User',
        entityId: user._id,
        details: { role: user.role, provider: 'google' },
      });
    }

    res.status(created ? 201 : 200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
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

module.exports = { register, login, getMe, googleAuth, getGoogleConfig };
