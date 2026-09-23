// src/middleware/auth.ts — JWT verification middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export interface AuthPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  // Local development should be usable without an email delivery service.
  // Production retains the college-email verification requirement below.
  if (config.isDev) {
    next();
    return;
  }

  // This middleware is used AFTER requireAuth
  // We do a lightweight DB check only when needed
  prisma.user
    .findUnique({ where: { id: req.user!.userId }, select: { isVerified: true, isSuspended: true } })
    .then((u) => {
      if (!u || !u.isVerified) {
        res.status(403).json({ error: 'Email not verified' });
        return;
      }
      if (u.isSuspended) {
        res.status(403).json({ error: 'Account suspended' });
        return;
      }
      next();
    })
    .catch(next);
}
