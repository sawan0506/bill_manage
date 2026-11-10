import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';
import { logger } from '../config/logger.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'hardware_access_secret_key_1234567890';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hardware_refresh_secret_key_0987654321';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  path: '/'
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, username: user.username },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshToken = jwt.sign(
    { userId: user._id, tokenHash: hashToken(rawRefreshToken) },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken, rawRefreshToken };
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier.toLowerCase() }, { phone: identifier }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/phone or password.'
      });
    }

    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.lockoutUntil - new Date()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed logins. Please try again in ${waitMinutes} minute(s).`
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the owner.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      await logAudit({
        action: 'FAILED_LOGIN',
        resourceType: 'User',
        resourceId: user._id,
        req,
        user,
        details: { identifier }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid username/phone or password.'
      });
    }

    // Reset failed attempts upon successful login
    await user.resetFailedAttempts();
    user.lastLogin = new Date();

    const { accessToken, refreshToken, rawRefreshToken } = generateTokens(user);

    // Store hashed refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens.push({
      tokenHash: hashToken(rawRefreshToken),
      expiresAt
    });

    // Prune expired refresh tokens
    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
    await user.save();

    // Set secure httpOnly cookies
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000 // 15 mins
    });
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await logAudit({
      action: 'LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      req,
      user
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role
        },
        accessToken // Also provide in payload for optional client header fallback
      }
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const rawCookieToken = req.cookies?.refreshToken;
    const authHeader = req.headers.authorization;
    const token = rawCookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer active.'
      });
    }

    // Verify token exists in user's active tokens list
    const tokenRecordIndex = user.refreshTokens.findIndex(
      (t) => t.tokenHash === decoded.tokenHash && t.expiresAt > new Date()
    );

    if (tokenRecordIndex === -1) {
      // Possible token reuse attempt: invalidate all tokens for security
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalid or reused. Please login again.'
      });
    }

    // Remove old token (token rotation)
    user.refreshTokens.splice(tokenRecordIndex, 1);

    const { accessToken, refreshToken: newRefreshToken, rawRefreshToken } = generateTokens(user);

    user.refreshTokens.push({
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refreshToken', newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const rawCookieToken = req.cookies?.refreshToken;
    if (rawCookieToken) {
      try {
        const decoded = jwt.verify(rawCookieToken, REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshTokens: { tokenHash: decoded.tokenHash } }
        });
      } catch (e) {
        // Ignore verify failure on logout
      }
    }

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    if (req.user) {
      await logAudit({
        action: 'LOGOUT',
        resourceType: 'User',
        resourceId: req.user._id,
        req,
        user: req.user
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      phone: req.user.phone,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    }
  });
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.refreshTokens = []; // Revoke other sessions
    await user.save();

    await logAudit({
      action: 'CHANGE_PASSWORD',
      resourceType: 'User',
      resourceId: user._id,
      req,
      user
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash -refreshTokens').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, username, phone, password, role } = req.body;

    const existing = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { phone }]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this username or phone already exists.'
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      username: username.toLowerCase(),
      phone,
      passwordHash,
      role
    });

    await logAudit({
      action: 'USER_CREATE',
      resourceType: 'User',
      resourceId: newUser._id,
      req,
      user: req.user,
      details: { name, username, role, phone }
    });

    res.status(201).json({
      success: true,
      message: 'New staff user created successfully.',
      data: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    targetUser.isActive = !targetUser.isActive;
    if (!targetUser.isActive) {
      targetUser.refreshTokens = []; // Terminate active sessions
    }
    await targetUser.save();

    await logAudit({
      action: targetUser.isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      resourceType: 'User',
      resourceId: targetUser._id,
      req,
      user: req.user,
      details: { username: targetUser.username, isActive: targetUser.isActive }
    });

    res.status(200).json({
      success: true,
      message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: {
        id: targetUser._id,
        isActive: targetUser.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};
