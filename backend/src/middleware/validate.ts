import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/ValidationError';

type ValidatorFn = (data: unknown) => { value: unknown; errors: Record<string, string> | null };

export function validate(validator: ValidatorFn, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : req.query;
    const { value, errors } = validator(data);

    if (errors && Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    if (source === 'body') {
      req.body = value;
    } else {
      req.query = value as Record<string, string>;
    }

    next();
  };
}
