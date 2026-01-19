import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(', ');
      next(new ValidationError(messages));
      return;
    }

    req.body = value;
    next();
  };
};



