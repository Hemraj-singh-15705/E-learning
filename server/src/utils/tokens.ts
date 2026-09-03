import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../types/user';

export const generateAccessToken = (user: IUser): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    secret,
    { expiresIn: expiresIn as any }
  );
};

export const generateRefreshToken = (user: IUser): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user._id },
    secret,
    { expiresIn: expiresIn as any }
  );
};

export const sendTokenResponse = async (
  user: IUser,
  statusCode: number,
  res: Response
): Promise<void> => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user document
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const isProduction = process.env.NODE_ENV === 'production';

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching refresh token
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Also set accessToken in cookie if client prefers cookie-based auth
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes matching access token
  });

  // Omit password from output
  const userOutput = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    avatar: user.avatar || '',
    bio: user.bio || '',
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    permissions: user.permissions || [],
    createdAt: user.createdAt
  };

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Account created successfully.' : 'Success',
    token: accessToken,
    user: userOutput,
    data: {
      token: accessToken,
      user: userOutput
    }
  });
};
