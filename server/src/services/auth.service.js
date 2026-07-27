const User = require('../models/User');
const { generateToken } = require('../utils/jwtHelper');
const ApiError = require('../utils/ApiError');
const { computeStreak } = require('./progress.service');

async function register({ name, email, password }) {
  const existing = await User.findOne({ email });

  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({ name, email, passwordHash: password });
  const token = generateToken(user._id, user.name, user.email);

  return { user: { id: user._id, name: user.name, email: user.email }, token };
}

async function login({ email, password }) {
  const user = await User.findByEmail(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id, user.name, user.email);

  return { user: { id: user._id, name: user.name, email: user.email }, token };
}

async function getMe(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const streak = user.streak ? { ...user.streak.toObject(), current: computeStreak(user.streak) } : undefined;
  return { id: user._id, name: user.name, email: user.email, avatar: user.avatar, streak, preferences: user.preferences };
}

module.exports = { register, login, getMe };
