import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || `req_${crypto.randomBytes(8).toString('hex')}`;

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export default requestIdMiddleware;
