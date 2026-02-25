import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import config from '../config/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Also check for token in cookies
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Not authorized to access this route');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Find user
    const user = await User.findById(decoded.id).select('-password -refreshTokens');

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('User account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Not authorized to perform this action'));
    }
    next();
  };
};