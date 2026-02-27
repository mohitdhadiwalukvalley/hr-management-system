import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

// General API rate limiter - disabled in development
export const limiter = config.nodeEnv === 'development'
  ? (req, res, next) => next() // No rate limiting in development
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Auth rate limiter - disabled in development
export const authLimiter = config.nodeEnv === 'development'
  ? (req, res, next) => next() // No rate limiting in development
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 attempts per window in production
      message: {
        success: false,
        message: 'Too many login attempts, please try again later.',
      },
    });