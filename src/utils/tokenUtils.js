// src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');

const generateAccessToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

const generateRefreshToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '30d',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
