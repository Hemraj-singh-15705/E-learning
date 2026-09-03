import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import User from '../models/User';
import { IUser } from '../types/user';

// Extend Express Request type declaration to support req.user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Get token from Authorization header or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      next(new AppError('You are not logged in. Please log in to get access.', 401));
      return;
    }

    // 2. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'development_only_secret_key_for_jwt_access_tokens_987654321'
    ) as { id: string; email: string; role: string };

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      next(new AppError('The user belonging to this token no longer exists.', 401));
      return;
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'MENTOR' | 'STUDENT'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User authentication details not found.', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action.', 403));
      return;
    }

    next();
  };
};
