import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      message,
      errors: [err.stack || ''],
      error: err
    });
    return;
  }

  // Production settings
  // 1. Mongoose Bad ObjectID (CastError)
  if (err.name === 'CastError') {
    message = `Resource not found with id: ${err.value}`;
    statusCode = 400;
  }

  // 2. Mongoose Duplicate Key (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `A record with this ${field || 'value'} already exists.`;
    statusCode = 409;
  }

  // 3. Mongoose Validation error
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors || {})
      .map((el: any) => el.message)
      .join(', ');
    message = `Validation Error: ${errorDetails}`;
    statusCode = 400;
  }

  // 4. JWT invalid error
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token. Please log in again.';
    statusCode = 401;
  }

  // 5. JWT expired error
  if (err.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again.';
    statusCode = 401;
  }

  // Determine if it is a trusted operational error (from AppError)
  const isOperational = err instanceof AppError || err.isOperational === true;

  if (isOperational) {
    res.status(statusCode).json({
      success: false,
      message,
      errors: []
    });
  } else {
    // Unknown or programming error: don't leak details to client
    console.error('UNEXPECTED SYSTEM ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server.',
      errors: []
    });
  }
};
export default errorHandler;
