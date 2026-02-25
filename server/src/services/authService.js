import jwt from 'jsonwebtoken';
import config from '../config/index.js';

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
      return null;
    }
  }

  getCookieOptions() {
    return {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }
}

export default new AuthService();