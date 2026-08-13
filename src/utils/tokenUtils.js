// src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');

const generateAccessToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '7d',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
