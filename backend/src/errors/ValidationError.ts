import { AppError } from './AppError';

export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 422);
    this.fields = fields;
  }
}
