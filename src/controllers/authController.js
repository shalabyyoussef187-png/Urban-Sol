const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingAdmin = await prisma.admin.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const admin = await prisma.admin.create({
      data: { username, email, password_hash },
    });

    res.status(201).json({ message: 'Admin registered successfully', adminId: admin.id });
  } catch (error) {
    res.status(500).json({ message: 'Error registering admin', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(admin.id);
    const refreshToken = generateRefreshToken(admin.id);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { refresh_token: refreshToken },
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Refresh token required' });

    const admin = await prisma.admin.findFirst({ where: { refresh_token: token } });
    if (!admin) return res.status(403).json({ message: 'Invalid refresh token' });

    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret', (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Refresh token expired' });

      const newAccessToken = generateAccessToken(admin.id);
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error refreshing token', error: error.message });
  }
};

module.exports = { register, login, refreshToken };
