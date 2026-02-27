import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import authService from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Check if user exists (case-insensitive email check)
  const existingUser = await User.findOne({ email: email?.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('User already exists with this email');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    role: role || 'employee',
  });

  // If role is employee, create an Employee profile
  if (user.role === 'employee') {
    // Find or create a default department
    let defaultDept = await Department.findOne({ code: 'GENERAL' });
    if (!defaultDept) {
      defaultDept = await Department.create({
        name: 'General',
        code: 'GENERAL',
        description: 'Default department for employees',
      });
    }

    // Generate employee ID
    const employeeCount = await Employee.countDocuments();
    const employeeId = `EMP${String(employeeCount + 1).padStart(4, '0')}`;

    // Create employee profile
    const employee = await Employee.create({
      employeeId,
      firstName: email.split('@')[0],
      lastName: 'User',
      email: email.toLowerCase(),
      department: defaultDept._id,
      designation: 'Employee',
      dateOfJoining: new Date(),
      userId: user._id,
    });

    // Link employee to user
    user.employeeId = employee._id;
    await user.save();
  }

  // Generate tokens
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);

  // Save refresh token
  user.addRefreshToken(refreshToken);
  await user.save();

  // Set cookie
  res.cookie('refreshToken', refreshToken, authService.getCookieOptions());

  // Populate employeeId for response
  await user.populate('employeeId');

  res.status(201).json(
    ApiResponse.created(
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
        accessToken,
      },
      'User registered successfully'
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password (email is case-insensitive)
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw ApiError.unauthorized('Account is deactivated');
  }

  // Compare password (trim to handle whitespace)
  const isMatch = await user.comparePassword(password?.trim());
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Generate tokens
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);

  // Save refresh token
  user.addRefreshToken(refreshToken);
  await user.save();

  // Set cookie
  res.cookie('refreshToken', refreshToken, authService.getCookieOptions());

  // Populate employeeId
  await user.populate('employeeId');

  res.json(
    ApiResponse.success(
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
        accessToken,
      },
      'Login successful'
    )
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token not provided');
  }

  // Verify refresh token
  const decoded = authService.verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Find user
  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  // Check if refresh token exists in user's tokens
  const tokenExists = user.refreshTokens.some(
    (t) => t.token === refreshToken
  );
  if (!tokenExists) {
    throw ApiError.unauthorized('Refresh token not found');
  }

  // Generate new tokens
  const accessToken = authService.generateAccessToken(user);
  const newRefreshToken = authService.generateRefreshToken(user);

  // Remove old refresh token and add new one
  user.removeRefreshToken(refreshToken);
  user.addRefreshToken(newRefreshToken);
  await user.save();

  // Set cookie
  res.cookie('refreshToken', newRefreshToken, authService.getCookieOptions());

  res.json(
    ApiResponse.success(
      {
        accessToken,
        refreshToken: newRefreshToken,
      },
      'Token refreshed successfully'
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const decoded = authService.verifyRefreshToken(refreshToken);
    if (decoded) {
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (user) {
        user.removeRefreshToken(refreshToken);
        await user.save();
      }
    }
  }

  res.clearCookie('refreshToken');
  res.json(ApiResponse.success(null, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshTokens')
    .populate('employeeId');

  res.json(ApiResponse.success({ user }));
});