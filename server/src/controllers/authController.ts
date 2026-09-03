import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from '../utils/errors';
import { sendTokenResponse } from '../utils/tokens';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if email already in use
    const userExists = await User.findOne({ email });
    if (userExists) {
      next(new AppError('A user with this email address already exists.', 400));
      return;
    }

    // Create user with active verified status - STRICTLY STUDENT for public registration
    const user = await User.create({
      name,
      email,
      password,
      role: 'STUDENT',
      isEmailVerified: true
    });

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Issue tokens directly so the student enters their workspace immediately
    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      next(new AppError('Invalid email or password.', 401));
      return;
    }

    // 2. Verify password
    const isCorrect = await user.comparePassword(password);
    if (!isCorrect) {
      next(new AppError('Invalid email or password.', 401));
      return;
    }

    // 3. Issue tokens, track login timestamp, and respond
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Find user and clear refresh token
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    // Clear cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax' | 'strict'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      next(new AppError('Verification token is invalid or has expired.', 400));
      return;
    }

    user.isEmailVerified = true;
    user.status = 'ACTIVE';
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Automatically log user in upon verification
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // We don't disclose if email exists for security, but return generic success
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
        data: {}
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save({ validateBeforeSave: false });

    // Log the reset link to the console for testing
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('\n==================================================');
    console.log(`🔑 [SIMULATED EMAIL] Password Reset URL for ${user.name} (${user.email}):`);
    console.log(resetUrl);
    console.log('==================================================\n');

    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      next(new AppError('Password reset token is invalid or has expired.', 400));
      return;
    }

    // Reset password and clear tokens
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      next(new AppError('User not found.', 404));
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      next(new AppError('Incorrect current password.', 400));
      return;
    }

    user.password = newPassword;
    await user.save();

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('User not authenticated.', 401));
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Success',
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
          role: req.user.role,
          avatar: req.user.avatar || '',
          bio: req.user.bio || '',
          status: req.user.status,
          isEmailVerified: req.user.isEmailVerified,
          permissions: req.user.permissions || [],
          createdAt: req.user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      next(new AppError('Session refresh token not found.', 401));
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'development_only_secret_key_for_jwt_refresh_tokens_123456789'
    ) as { id: string };

    // Check if user still exists and matches token
    const user = await User.findOne({ _id: decoded.id, refreshToken: token });
    if (!user) {
      next(new AppError('Invalid refresh session or user no longer exists.', 401));
      return;
    }

    // Refresh token rotation is recommended, but we can issue new access and keep current refresh or issue both
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
