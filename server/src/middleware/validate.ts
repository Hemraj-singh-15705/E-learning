import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => {
          // Remove the top level "body", "query" or "params" from the path
          const path = err.path.slice(1).join('.');
          return `${path || 'field'}: ${err.message}`;
        });
        
        res.status(400).json({
          success: false,
          message: `Validation error: ${details.join('; ')}`,
          errors: details
        });
        return;
      }
      next(error);
    }
  };
};
