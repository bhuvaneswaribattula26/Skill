// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Error) {
    console.error('[Error]', err.message, err.stack);
    const prismaCode = (err as Error & { code?: string }).code;
    if (prismaCode === 'P2021') {
      res.status(503).json({
        error: 'The application database has not been initialized yet. Please contact the site administrator.',
      });
      return;
    }
    res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
