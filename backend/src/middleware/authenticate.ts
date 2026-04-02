import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticationError } from '../errors/AuthenticationError';
import { JwtPayload } from '../types';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    throw new AuthenticationError('Invalid token');
  }
}
