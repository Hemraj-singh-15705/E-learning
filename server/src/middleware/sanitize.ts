import { Request, Response, NextFunction } from 'express';

/**
 * Recursively cleans an object by stripping keys that start with '$' or contain '.'
 * to prevent NoSQL query selector injections.
 */
function cleanObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObject(item));
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // If key starts with $ or contains a dot, skip it
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = cleanObject(value);
  }
  return cleaned;
}

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = cleanObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = cleanObject(req.params);
  }
  next();
};

export default mongoSanitize;
