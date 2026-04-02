import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/ValidationError';
import { config } from '../config';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(422).json({
      error: err.message,
      fields: err.fields,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Unknown / programmer error
  if (config.nodeEnv !== 'production') {
    console.error(err);
    res.status(500).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
