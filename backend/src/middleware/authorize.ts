import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError';

export function authorize(...roles: Array<'admin' | 'user'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
